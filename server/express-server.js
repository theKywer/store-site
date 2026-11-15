
const authMiddleware = require('./middleware/authMiddleware')
const adminMiddleware = require('./middleware/adminMiddleware')

const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const express = require('express')
const bcrypt = require('bcrypt')
const prisma = require('./prisma')
const { getEmailJsConfig, sendVerificationEmail } = require('./email/emailjsClient')

const app = express()
app.set('trust proxy', 1)
const POSTGRES_INT_MAX = 2147483647
const MAX_GALLERY_ITEMS = 20
const MAX_MEDIA_SOURCE_LENGTH = 2048
const MAX_MEDIA_ALT_LENGTH = 500
const MAX_KEY_INSERT_ATTEMPTS = 3
const DEMO_KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const EMAIL_CODE_TTL_MS = 10 * 60 * 1000
const EMAIL_CODE_RESEND_MS = 60 * 1000
const EMAIL_CODE_MAX_ATTEMPTS = 5

function createRateLimiter({ maxRequests, windowMs, code, message }) {
  const requestsByIp = new Map()
  let requestsSinceCleanup = 0

  return (req, res, next) => {
    const now = Date.now()
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const current = requestsByIp.get(ip)
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current

    if (entry.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      res.set('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ code, message, retryAfterSeconds })
    }

    entry.count += 1
    requestsByIp.set(ip, entry)
    requestsSinceCleanup += 1
    if (requestsSinceCleanup >= 256) {
      for (const [key, value] of requestsByIp) {
        if (value.resetAt <= now) requestsByIp.delete(key)
      }
      requestsSinceCleanup = 0
    }

    next()
  }
}

const limitRegistrationRequests = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  code: 'REGISTRATION_RATE_LIMITED',
  message: 'Слишком много попыток регистрации. Попробуйте позже.',
})
const limitVerificationRequests = createRateLimiter({
  maxRequests: 15,
  windowMs: 15 * 60 * 1000,
  code: 'VERIFICATION_RATE_LIMITED',
  message: 'Слишком много попыток подтверждения. Попробуйте позже.',
})
const limitResendRequests = createRateLimiter({
  maxRequests: 8,
  windowMs: 60 * 60 * 1000,
  code: 'RESEND_RATE_LIMITED',
  message: 'Слишком много запросов кода. Попробуйте позже.',
})

app.use(express.json({ limit: '100kb' }))

app.use((req, res, next) => {
  const allowedOrigin = process.env.CORS_ORIGIN

  if (allowedOrigin && req.headers.origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Некорректный JSON в теле запроса',
    })
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Тело запроса слишком большое',
    })
  }

  next(error)
})

function hasObjectBody(body) {
  return body !== null && typeof body === 'object' && !Array.isArray(body)
}

function isPostgresInt(value) {
  return Number.isSafeInteger(value) &&
    value >= -POSTGRES_INT_MAX - 1 &&
    value <= POSTGRES_INT_MAX
}

function parsePostgresId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null
  }

  const id = Number(value)

  return isPostgresInt(id) ? id : null
}

function generateDemoKey() {
  const value = Array.from(
    { length: 8 },
    () => DEMO_KEY_ALPHABET[crypto.randomInt(DEMO_KEY_ALPHABET.length)],
  ).join('')

  return `${value.slice(0, 4)}-${value.slice(4)}`
}

// Проверка и подготовка данных игры
function validateGameData(body, isPartial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Некорректные данные игры' }
  }

  const stringFields = [
    'title',
    'genre',
    'description',
    'image',
    'officialTrailerId',
    'developer',
    'publisher',
    'releaseDate',
    'ageRating',
    'platform',
  ]

  const data = {}

  for (const field of stringFields) {
    if (isPartial && body[field] === undefined) {
      continue
    }

    if (
      typeof body[field] !== 'string' ||
      (field !== 'officialTrailerId' && !body[field].trim())
    ) {
      return {
        error: `Некорректное поле: ${field}`,
      }
    }

    data[field] = body[field].trim()
  }

  // Цена
  if (!isPartial || body.price !== undefined) {
    if (
      !isPostgresInt(body.price) ||
      body.price < 0
    ) {
      return {
        error: 'Цена должна быть целым неотрицательным числом',
      }
    }

    data.price = body.price
  }

  // Старая цена
  if (body.oldPrice !== undefined) {
    if (
      body.oldPrice !== null &&
      (!isPostgresInt(body.oldPrice) || body.oldPrice < 0)
    ) {
      return {
        error: 'Некорректная старая цена',
      }
    }

    data.oldPrice = body.oldPrice
  } else if (!isPartial) {
    data.oldPrice = null
  }

  // Скидка
  if (body.discount !== undefined) {
    if (
      !Number.isInteger(body.discount) ||
      body.discount < 0 ||
      body.discount > 100
    ) {
      return {
        error: 'Скидка должна быть числом от 0 до 100',
      }
    }

    data.discount = body.discount
  } else if (!isPartial) {
    data.discount = 0
  }

  // Бейдж
  if (body.badge !== undefined) {
    if (
      body.badge !== null &&
      typeof body.badge !== 'string'
    ) {
      return {
        error: 'Некорректный бейдж',
      }
    }

    data.badge = body.badge
  } else if (!isPartial) {
    data.badge = null
  }

  // Галерея
  if (body.gallery !== undefined) {
    if (!Array.isArray(body.gallery)) {
      return {
        error: 'Галерея должна быть массивом',
      }
    }

    if (body.gallery.length > MAX_GALLERY_ITEMS) {
      return {
        error: `В галерее должно быть не более ${MAX_GALLERY_ITEMS} элементов`,
      }
    }

    const gallery = []
    const allowedMediaTypes = new Set(['image', 'video', 'youtube'])

    for (let index = 0; index < body.gallery.length; index++) {
      const media = body.gallery[index]
      const type = typeof media?.type === 'string' ? media.type.trim() : ''
      const src = typeof media?.src === 'string' ? media.src.trim() : ''

      if (
        !media ||
        !allowedMediaTypes.has(type) ||
        !src ||
        src.length > MAX_MEDIA_SOURCE_LENGTH
      ) {
        return {
          error: `Некорректный тип или источник элемента галереи №${index + 1}`,
        }
      }

      if (
        media.thumbnail !== undefined &&
        media.thumbnail !== null &&
        (typeof media.thumbnail !== 'string' ||
          media.thumbnail.trim().length > MAX_MEDIA_SOURCE_LENGTH)
      ) {
        return {
          error: 'Некорректная миниатюра галереи',
        }
      }

      if (
        media.alt !== undefined &&
        media.alt !== null &&
        (typeof media.alt !== 'string' ||
          media.alt.trim().length > MAX_MEDIA_ALT_LENGTH)
      ) {
        return {
          error: 'Некорректное описание изображения',
        }
      }

      const sortOrder = media.sortOrder ?? index

      if (!isPostgresInt(sortOrder) || sortOrder < 0) {
        return {
          error: 'Некорректный порядок элементов галереи',
        }
      }

      gallery.push({
        type,
        src,
        thumbnail: media.thumbnail?.trim() || null,
        alt: media.alt?.trim() || null,
        sortOrder,
      })
    }

    data.gallery = gallery
  } else if (!isPartial) {
    data.gallery = []
  }

  return { data }
}

// Главная страница
app.get('/', (req, res) => {
  res.send('Добро пожаловать в Luna Market')
})

// Информация о магазине
app.get('/about', (req, res) => {
  res.send('Luna Market — игровой магазин')
})

// Контакты
app.get('/contact', (req, res) => {
  res.send('Связаться с Luna Market можно через поддержку')
})

function generateEmailVerificationCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function hashEmailVerificationCode(userId, code) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')

  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${code}`)
    .digest('hex')
}

function matchesEmailVerificationCode(userId, code, expectedHash) {
  const candidate = Buffer.from(hashEmailVerificationCode(userId, code), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

// Регистрация пользователя с обязательным подтверждением почты
app.post('/auth/register', limitRegistrationRequests, async (req, res) => {
  try {
    if (!hasObjectBody(req.body)) {
      return res.status(400).json({
        message: 'Тело запроса должно быть JSON-объектом',
      })
    }

    const { name, email, password } = req.body

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Заполните все поля корректно',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    if (
      normalizedName.length > 40 ||
      !/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'’-]{0,39}$/u.test(normalizedName)
    ) {
      return res.status(400).json({
        message: 'Имя должно содержать от 1 до 40 символов: буквы, цифры, пробелы, дефис, точку или апостроф',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Некорректный email',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Пароль должен содержать минимум 8 символов',
      })
    }

    try {
      getEmailJsConfig()
    } catch (error) {
      return res.status(503).json({
        code: error.code || 'EMAIL_SERVICE_NOT_CONFIGURED',
        message: error.message,
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (existingUser) {
      if (!existingUser.emailVerifiedAt) {
        return res.status(409).json({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Для этого адреса ещё не завершено подтверждение почты.',
          email: normalizedEmail,
        })
      }

      return res.status(409).json({
        message: 'Пользователь уже существует',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const code = generateEmailVerificationCode()
    const now = new Date()
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
        },
      })

      await transaction.emailVerification.create({
        data: {
          userId: createdUser.id,
          codeHash: hashEmailVerificationCode(createdUser.id, code),
          expiresAt: new Date(now.getTime() + EMAIL_CODE_TTL_MS),
          lastSentAt: now,
        },
      })

      return createdUser
    })

    try {
      await sendVerificationEmail(normalizedEmail, code)
    } catch (error) {
      const isConfigurationError = error.code === 'EMAIL_SERVICE_NOT_CONFIGURED'
      return res.status(isConfigurationError ? 503 : 502).json({
        code: error.code || 'EMAIL_SEND_FAILED',
        message: isConfigurationError
          ? error.message
          : 'Аккаунт создан, но письмо не отправилось. Перейдите к подтверждению почты и попробуйте запросить новый код позже.',
        email: user.email,
        resendAfterSeconds: 60,
      })
    }

    res.status(201).json({
      message: 'Аккаунт создан. Код подтверждения отправлен на указанную почту.',
      email: user.email,
      resendAfterSeconds: 60,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Пользователь уже существует',
      })
    }

    console.error('Ошибка регистрации:', error.code || error.name || 'unknown')

    res.status(500).json({
      message: 'Не удалось завершить регистрацию. Попробуйте позже.',
    })
  }
})

// Вход пользователя
app.post('/auth/login', async (req, res) => {
  try {
    if (!hasObjectBody(req.body)) {
      return res.status(400).json({
        message: 'Тело запроса должно быть JSON-объектом',
      })
    }

    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Введите email и пароль',
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    })

    if (!user) {
      return res.status(401).json({
        message: 'Неверный email или пароль',
      })
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password,
    )

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Неверный email или пароль',
      })
    }

    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Подтвердите адрес электронной почты, прежде чем войти.',
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    )

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Ошибка входа:', error)

    res.status(500).json({
      message: 'Не удалось выполнить вход',
    })
  }
})

// Подтверждение адреса одноразовым кодом
app.post('/auth/verify-email', limitVerificationRequests, async (req, res) => {
  try {
    if (!hasObjectBody(req.body)) {
      return res.status(400).json({ message: 'Тело запроса должно быть JSON-объектом' })
    }

    const { email, code } = req.body
    if (typeof email !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        code: 'INVALID_OR_EXPIRED_CODE',
        message: 'Проверьте email и введите шестизначный код.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        code: 'INVALID_OR_EXPIRED_CODE',
        message: 'Код неверный, просрочен или больше недействителен.',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerifiedAt: true },
    })

    if (!user || user.emailVerifiedAt) {
      return res.status(400).json({
        code: 'INVALID_OR_EXPIRED_CODE',
        message: 'Код неверный, просрочен или больше недействителен.',
      })
    }

    const now = new Date()
    const result = await prisma.$transaction(async (transaction) => {
      const verification = await transaction.emailVerification.findUnique({
        where: { userId: user.id },
      })

      if (
        !verification ||
        verification.expiresAt <= now ||
        verification.attempts >= EMAIL_CODE_MAX_ATTEMPTS
      ) {
        return false
      }

      const matches = matchesEmailVerificationCode(user.id, code, verification.codeHash)
      if (!matches) {
        await transaction.emailVerification.updateMany({
          where: {
            id: verification.id,
            attempts: { lt: EMAIL_CODE_MAX_ATTEMPTS },
            expiresAt: { gt: now },
          },
          data: { attempts: { increment: 1 } },
        })
        return false
      }

      const deleted = await transaction.emailVerification.deleteMany({
        where: {
          id: verification.id,
          codeHash: verification.codeHash,
          attempts: { lt: EMAIL_CODE_MAX_ATTEMPTS },
          expiresAt: { gt: now },
        },
      })
      if (deleted.count !== 1) return false

      const updated = await transaction.user.updateMany({
        where: { id: user.id, emailVerifiedAt: null },
        data: { emailVerifiedAt: now },
      })

      return updated.count === 1
    })

    if (!result) {
      return res.status(400).json({
        code: 'INVALID_OR_EXPIRED_CODE',
        message: 'Код неверный, просрочен или больше недействителен. Запросите новый код, если срок истёк.',
      })
    }

    res.json({
      message: 'Почта подтверждена. Теперь вы можете войти в аккаунт.',
      email: normalizedEmail,
    })
  } catch (error) {
    console.error('Ошибка подтверждения почты:', error.code || error.name || 'unknown')
    res.status(500).json({ message: 'Не удалось подтвердить почту. Попробуйте позже.' })
  }
})

// Повторная отправка кода с нейтральным ответом, не раскрывающим наличие аккаунта
app.post('/auth/resend-verification', limitResendRequests, async (req, res) => {
  try {
    if (!hasObjectBody(req.body) || typeof req.body.email !== 'string') {
      return res.status(400).json({ message: 'Укажите корректный email' })
    }

    const normalizedEmail = req.body.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Укажите корректный email' })
    }

    try {
      getEmailJsConfig()
    } catch (error) {
      return res.status(503).json({
        code: error.code || 'EMAIL_SERVICE_NOT_CONFIGURED',
        message: error.message,
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerifiedAt: true },
    })

    const genericResponse = () => res.status(202).json({
      message: 'Если этому адресу требуется подтверждение, проверьте почту и папку «Спам». Доставка зависит от доступности почтового сервиса; новый запрос доступен не чаще раза в минуту.',
      resendAfterSeconds: 60,
    })

    if (!user || user.emailVerifiedAt) return genericResponse()

    const existingVerification = await prisma.emailVerification.findUnique({
      where: { userId: user.id },
    })
    if (!existingVerification) return genericResponse()

    const now = new Date()
    const code = generateEmailVerificationCode()
    const updated = await prisma.emailVerification.updateMany({
      where: {
        id: existingVerification.id,
        lastSentAt: { lte: new Date(now.getTime() - EMAIL_CODE_RESEND_MS) },
      },
      data: {
        codeHash: hashEmailVerificationCode(user.id, code),
        expiresAt: new Date(now.getTime() + EMAIL_CODE_TTL_MS),
        attempts: 0,
        lastSentAt: now,
      },
    })

    if (updated.count !== 1) return genericResponse()

    try {
      await sendVerificationEmail(normalizedEmail, code)
    } catch (error) {
      console.error('Повторная отправка письма не удалась:', error.code || error.name || 'unknown')
      return genericResponse()
    }

    return genericResponse()
  } catch (error) {
    console.error('Ошибка повторной отправки кода:', error.code || error.name || 'unknown')
    res.status(500).json({ message: 'Не удалось запросить новый код. Попробуйте позже.' })
  }
})

function formatUserProfile(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    createdAt: user.createdAt,
    avatar: user.avatarData && user.avatarMimeType
      ? `data:${user.avatarMimeType};base64,${globalThis.Buffer.from(user.avatarData).toString('base64')}`
      : null,
  }
}

const profileSelection = {
  id: true,
  email: true,
  role: true,
  name: true,
  createdAt: true,
  avatarData: true,
  avatarMimeType: true,
}

// Профиль текущего пользователя
app.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (!isPostgresInt(req.user.id) || req.user.id <= 0) {
      return res.status(401).json({ message: 'Некорректные данные пользователя' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: profileSelection,
    })

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    res.json(formatUserProfile(user))
  } catch (error) {
    console.error('Ошибка получения профиля:', error)
    res.status(500).json({ message: 'Не удалось получить профиль' })
  }
})

// Изменение имени текущего пользователя
app.patch('/profile', authMiddleware, async (req, res) => {
  try {
    if (!isPostgresInt(req.user.id) || req.user.id <= 0) {
      return res.status(401).json({ message: 'Некорректные данные пользователя' })
    }

    if (!hasObjectBody(req.body) || Object.keys(req.body).some((key) => key !== 'name')) {
      return res.status(400).json({ message: 'Можно изменить только имя пользователя' })
    }

    if (typeof req.body.name !== 'string' || req.body.name.trim().length > 40) {
      return res.status(400).json({ message: 'Имя должно содержать не более 40 символов' })
    }

    const name = req.body.name.trim()

    if (name && !/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'’-]{0,39}$/u.test(name)) {
      return res.status(400).json({
        message: 'Имя может содержать буквы, цифры, пробелы, дефис, точку и апостроф',
      })
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name || null },
      select: profileSelection,
    })

    res.json(formatUserProfile(user))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    console.error('Ошибка изменения профиля:', error)
    res.status(500).json({ message: 'Не удалось сохранить имя' })
  }
})

// Загрузка или замена аватара текущего пользователя
app.put(
  '/profile/avatar',
  authMiddleware,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' }),
  async (req, res) => {
    try {
      if (!isPostgresInt(req.user.id) || req.user.id <= 0) {
        return res.status(401).json({ message: 'Некорректные данные пользователя' })
      }

      const mimeType = String(req.headers['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase()
      const bytes = req.body
      const validImage = globalThis.Buffer.isBuffer(bytes) && (
        (mimeType === 'image/jpeg' && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
        (mimeType === 'image/png' && bytes.length >= 8 && bytes.subarray(0, 8).equals(globalThis.Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
        (mimeType === 'image/webp' && bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
      )

      if (!validImage) {
        return res.status(415).json({
          message: 'Выберите изображение JPEG, PNG или WebP размером не более 2 МБ',
        })
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarData: bytes, avatarMimeType: mimeType },
        select: profileSelection,
      })

      res.json(formatUserProfile(user))
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Пользователь не найден' })
      }

      console.error('Ошибка загрузки аватара:', error)
      res.status(500).json({ message: 'Не удалось сохранить аватар' })
    }
  },
  (error, req, res, next) => {
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ message: 'Размер аватара не должен превышать 2 МБ' })
    }

    if (error.type === 'encoding.unsupported') {
      return res.status(415).json({ message: 'Неподдерживаемый формат изображения' })
    }

    next(error)
  },
)

// Удаление аватара текущего пользователя
app.delete('/profile/avatar', authMiddleware, async (req, res) => {
  try {
    if (!isPostgresInt(req.user.id) || req.user.id <= 0) {
      return res.status(401).json({ message: 'Некорректные данные пользователя' })
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarData: null, avatarMimeType: null },
      select: profileSelection,
    })

    res.json(formatUserProfile(user))
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    console.error('Ошибка удаления аватара:', error)
    res.status(500).json({ message: 'Не удалось удалить аватар' })
  }
})

// Получение всех игр
app.get('/games', async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      include: {
        gallery: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    res.json(games)
  } catch (error) {
    console.error('Ошибка получения игр:', error)

    res.status(500).json({
      message: 'Не удалось получить игры',
    })
  }
})

// Получение одной игры
app.get('/games/:id', async (req, res) => {
  try {
    const gameId = parsePostgresId(req.params.id)

    if (gameId === null) {
      return res.status(400).json({
        message: 'Некорректный ID игры',
      })
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        gallery: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    if (!game) {
      return res.status(404).json({
        message: 'Игра не найдена',
      })
    }

    res.json(game)
  } catch (error) {
    console.error('Ошибка получения игры:', error)

    res.status(500).json({
      message: 'Не удалось получить игру',
    })
  }
})

// Добавление игры
app.post('/games', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = validateGameData(req.body)

    if (error) {
      return res.status(400).json({
        message: error,
      })
    }

    const { gallery, ...gameData } = data

    const newGame = await prisma.game.create({
      data: {
        ...gameData,
        gallery: {
          create: gallery,
        },
      },
      include: {
        gallery: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    res.status(201).json(newGame)
  } catch (error) {
    console.error('Ошибка создания игры:', error)

    res.status(500).json({
      message: 'Не удалось создать игру',
    })
  }
})

// Редактирование игры
app.patch('/games/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const gameId = parsePostgresId(req.params.id)

    if (gameId === null) {
      return res.status(400).json({
        message: 'Некорректный ID игры',
      })
    }

    const existingGame = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
    })

    if (!existingGame) {
      return res.status(404).json({
        message: 'Игра не найдена',
      })
    }

    const { data, error } = validateGameData(req.body, true)

    if (error) {
      return res.status(400).json({
        message: error,
      })
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Нет данных для обновления',
      })
    }

    const { gallery, ...gameData } = data

    const updatedGame = await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        ...gameData,

        ...(gallery !== undefined && {
          gallery: {
            deleteMany: {},
            create: gallery,
          },
        }),
      },
      include: {
        gallery: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    res.json(updatedGame)
  } catch (error) {
    console.error('Ошибка обновления игры:', error)

    res.status(500).json({
      message: 'Не удалось изменить игру',
    })
  }
})

// Удаление игры
app.delete('/games/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const gameId = parsePostgresId(req.params.id)

    if (gameId === null) {
      return res.status(400).json({
        message: 'Некорректный ID игры',
      })
    }

    const existingGame = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
    })

    if (!existingGame) {
      return res.status(404).json({
        message: 'Игра не найдена',
      })
    }

    const deletedGame = await prisma.game.delete({
      where: {
        id: gameId,
      },
    })

    res.json({
      message: 'Игра успешно удалена',
      game: deletedGame,
    })
  } catch (error) {
    console.error('Ошибка удаления игры:', error)

    res.status(500).json({
      message: 'Не удалось удалить игру',
    })
  }
})

// Создание заказа
app.post('/orders', authMiddleware, async (req, res) => {
  try {
    if (!hasObjectBody(req.body)) {
      return res.status(400).json({
        message: 'Тело запроса должно быть JSON-объектом',
      })
    }

    const userId = req.user.id
    const { items } = req.body

    if (!isPostgresInt(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Некорректные данные пользователя',
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Корзина пуста',
      })
    }

    const gameIds = []

    for (const item of items) {
      if (
        !item ||
        !isPostgresInt(item.gameId) ||
        item.gameId <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > 99
      ) {
        return res.status(400).json({
          message: 'Некорректные данные товара',
        })
      }

      gameIds.push(item.gameId)
    }

    if (new Set(gameIds).size !== gameIds.length) {
      return res.status(400).json({
        message: 'В заказе обнаружены повторяющиеся игры',
      })
    }

    const order = await prisma.$transaction(async (tx) => {
      const games = await tx.game.findMany({
        where: {
          id: {
            in: gameIds,
          },
        },
      })

      if (games.length !== gameIds.length) {
        throw new Error('GAME_NOT_FOUND')
      }

      let totalAmount = 0

      const orderItems = items.map((item) => {
        const game = games.find(
          (game) => game.id === item.gameId,
        )

        const itemTotal = game.price * item.quantity

        if (
          !Number.isSafeInteger(itemTotal) ||
          itemTotal > POSTGRES_INT_MAX - totalAmount
        ) {
          throw new Error('INVALID_TOTAL')
        }

        totalAmount += itemTotal

        return {
          gameId: game.id,
          gameTitle: game.title,
          quantity: item.quantity,
          unitPrice: game.price,
        }
      })

      if (!isPostgresInt(totalAmount) || totalAmount < 0) {
        throw new Error('INVALID_TOTAL')
      }

      return tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      })
    })

    res.status(201).json({
      message: 'Заказ успешно создан',
      order,
    })
  } catch (error) {
    if (error.message === 'GAME_NOT_FOUND') {
      return res.status(404).json({
        message: 'Одна или несколько игр не найдены',
      })
    }

    if (error.message === 'INVALID_TOTAL') {
      return res.status(400).json({
        message: 'Слишком большая сумма заказа',
      })
    }

    console.error('Ошибка создания заказа:', error)

    res.status(500).json({
      message: 'Не удалось создать заказ',
    })
  }
})

// Оплата заказа и выдача демо-ключей
app.post('/orders/:id/pay', authMiddleware, async (req, res) => {
  try {
    const orderId = parsePostgresId(req.params.id)
    const userId = req.user.id

    if (orderId === null) {
      return res.status(400).json({
        message: 'Некорректный ID заказа',
      })
    }

    if (!isPostgresInt(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Некорректные данные пользователя',
      })
    }

    let order

    // При конфликте уникального ключа Prisma откатывает транзакцию целиком;
    // повторяем её с новой генерацией ключей.
    for (let attempt = 0; attempt < MAX_KEY_INSERT_ATTEMPTS; attempt++) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const existingOrder = await tx.order.findFirst({
            where: {
              id: orderId,
              userId,
            },
            include: {
              items: true,
            },
          })

          if (!existingOrder) {
            throw new Error('ORDER_NOT_FOUND')
          }

          if (existingOrder.status === 'PAID') {
            throw new Error('ORDER_ALREADY_PAID')
          }

          if (existingOrder.status === 'CANCELLED') {
            throw new Error('ORDER_CANCELLED')
          }

          const updated = await tx.order.updateMany({
            where: {
              id: orderId,
              userId,
              status: 'PENDING',
            },
            data: {
              status: 'PAID',
            },
          })

          if (updated.count !== 1) {
            throw new Error('ORDER_ALREADY_PROCESSED')
          }

          const keys = []
          const generatedCodes = new Set()

          for (const item of existingOrder.items) {
            for (let copy = 0; copy < item.quantity; copy++) {
              let code

              do {
                code = generateDemoKey()
              } while (generatedCodes.has(code))

              generatedCodes.add(code)
              keys.push({
                orderItemId: item.id,
                code,
              })
            }
          }

          if (keys.length > 0) {
            await tx.orderItemKey.createMany({
              data: keys,
            })
          }

          return tx.order.findUnique({
            where: {
              id: orderId,
            },
            include: {
              items: {
                include: {
                  keys: true,
                },
              },
            },
          })
        })
        break
      } catch (error) {
        if (error.code !== 'P2002' || attempt === MAX_KEY_INSERT_ATTEMPTS - 1) {
          throw error
        }
      }
    }

    res.json({
      message: 'Заказ успешно оплачен',
      order,
    })
  } catch (error) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({
        message: 'Заказ не найден',
      })
    }

    if (error.message === 'ORDER_ALREADY_PAID') {
      return res.status(409).json({
        message: 'Заказ уже оплачен',
      })
    }

    if (error.message === 'ORDER_CANCELLED') {
      return res.status(409).json({
        message: 'Нельзя оплатить отменённый заказ',
      })
    }

    if (error.message === 'ORDER_ALREADY_PROCESSED') {
      return res.status(409).json({
        message: 'Заказ уже обрабатывается или был оплачен',
      })
    }

    console.error('Ошибка оплаты заказа:', error)

    res.status(500).json({
      message: 'Не удалось оплатить заказ',
    })
  }
})

// Получение заказов текущего пользователя
app.get('/orders/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    if (!isPostgresInt(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Некорректные данные пользователя',
      })
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            keys: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(orders)
  } catch (error) {
    console.error('Ошибка получения заказов:', error)

    res.status(500).json({
      message: 'Не удалось получить заказы',
    })
  }
})

// Получение всех заказов для администратора
app.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(users)
  } catch (error) {
    console.error('Ошибка получения пользователей администратора:', error)
    res.status(500).json({ message: 'Не удалось получить список пользователей' })
  }
})

// Назначение или снятие роли администратора
app.patch('/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parsePostgresId(req.params.id)
    const { role } = req.body || {}

    if (userId === null || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Некорректные данные пользователя или роли' })
    }

    if (userId === req.user.id && role !== 'ADMIN') {
      return res.status(409).json({ message: 'Нельзя снять роль администратора с самого себя' })
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
    if (!target) return res.status(404).json({ message: 'Пользователь не найден' })

    if (target.role === 'ADMIN' && role === 'USER') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return res.status(409).json({ message: 'Нельзя снять роль у последнего администратора' })
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true, createdAt: true, emailVerifiedAt: true },
    })
    res.json(user)
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Пользователь не найден' })
    console.error('Ошибка изменения роли пользователя:', error)
    res.status(500).json({ message: 'Не удалось изменить роль пользователя' })
  }
})

app.get('/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        items: {
          include: {
            keys: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(orders)
  } catch (error) {
    console.error('Ошибка получения заказов администратора:', error)

    res.status(500).json({
      message: 'Не удалось получить список заказов',
    })
  }
})

// Отмена ожидающего заказа администратором
app.patch('/admin/orders/:id/cancel', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orderId = parsePostgresId(req.params.id)

    if (orderId === null) {
      return res.status(400).json({
        message: 'Некорректный ID заказа',
      })
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    })

    if (!existingOrder) {
      return res.status(404).json({
        message: 'Заказ не найден',
      })
    }

    const updated = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    })

    if (updated.count !== 1) {
      return res.status(409).json({
        message: existingOrder.status === 'PAID'
          ? 'Оплаченный заказ нельзя отменить этим способом'
          : 'Заказ уже отменён или изменён',
      })
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        items: {
          include: {
            keys: true,
          },
        },
      },
    })

    res.json({
      message: 'Заказ отменён',
      order,
    })
  } catch (error) {
    console.error('Ошибка отмены заказа:', error)

    res.status(500).json({
      message: 'Не удалось отменить заказ',
    })
  }
})

// Запуск сервера
const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Express запущен: http://localhost:${port}`)
})
