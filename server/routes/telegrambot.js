
const express = require('express')
const crypto = require('crypto')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

const TOKEN_TTL_MS = 10 * 60 * 1000
const TOKEN_COOLDOWN_MS = 30 * 1000

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Доступ только для нашего Python-бота
function botAuth(req, res, next) {
  const expected = process.env.TELEGRAM_BRIDGE_SECRET
  const provided = req.get('X-Telegram-Bot-Secret')

  if (!expected || expected.length < 32) {
    return res.status(503).json({
      message: 'Интеграция Telegram не настроена',
    })
  }

  const a = Buffer.from(expected)
  const b = Buffer.from(provided || '')

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({
      message: 'Доступ запрещён',
    })
  }

  next()
}

// Проверяем, привязан ли Telegram
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const link = await prisma.telegramLink.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    })

    res.json({ linked: Boolean(link) })
  } catch (error) {
    console.error('Telegram status:', error)
    res.status(500).json({ message: 'Ошибка проверки привязки' })
  }
})

// Создаём одноразовый токен
router.post('/link-token', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const now = new Date()

    const linked = await prisma.telegramLink.findUnique({
      where: { userId },
    })

    if (linked) {
      return res.status(409).json({
        message: 'Telegram уже привязан',
      })
    }

    const previous = await prisma.telegramLinkToken.findUnique({
      where: { userId },
    })

    if (
      previous &&
      now.getTime() - previous.createdAt.getTime() < TOKEN_COOLDOWN_MS
    ) {
      return res.status(429).json({
        message: 'Повторите запрос через 30 секунд',
      })
    }

    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS)

    await prisma.telegramLinkToken.upsert({
      where: { userId },
      update: {
        tokenHash: hashToken(token),
        expiresAt,
        createdAt: now,
      },
      create: {
        userId,
        tokenHash: hashToken(token),
        expiresAt,
      },
    })

    res.json({ token, expiresAt })
  } catch (error) {
    console.error('Telegram link-token:', error)
    res.status(500).json({ message: 'Не удалось создать ссылку' })
  }
})

// Бот подтверждает одноразовую ссылку
router.post('/consume', botAuth, async (req, res) => {
  const { token, telegramUserId } = req.body || {}

  if (
    typeof token !== 'string' ||
    !/^[a-f0-9]{48}$/.test(token) ||
    typeof telegramUserId !== 'string' ||
    !/^[1-9]\d{0,19}$/.test(telegramUserId)
  ) {
    return res.status(400).json({ message: 'Некорректные данные' })
  }

  const telegramId = BigInt(telegramUserId)

  if (telegramId > 9223372036854775807n) {
    return res.status(400).json({ message: 'Некорректный Telegram ID' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const pending = await tx.telegramLinkToken.findUnique({
        where: { tokenHash: hashToken(token) },
      })

      if (!pending || pending.expiresAt <= new Date()) {
        return 'expired'
      }

      // Удаляем код атомарно, чтобы его нельзя было применить дважды
      const removed = await tx.telegramLinkToken.deleteMany({
        where: {
          id: pending.id,
          expiresAt: { gt: new Date() },
        },
      })

      if (removed.count !== 1) return 'expired'

      const existing = await tx.telegramLink.findUnique({
        where: { userId: pending.userId },
      })

      if (existing) return 'already'

      await tx.telegramLink.create({
        data: {
          userId: pending.userId,
          telegramUserId: telegramId,
        },
      })

      return 'linked'
    })

    if (result === 'expired') {
      return res.status(410).json({
        message: 'Ссылка истекла или уже использована',
      })
    }

    if (result === 'already') {
      return res.status(409).json({
        message: 'Аккаунт уже привязан',
      })
    }

    res.json({ linked: true })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Этот Telegram уже связан с другим аккаунтом',
      })
    }

    console.error('Telegram consume:', error)
    res.status(500).json({ message: 'Ошибка привязки' })
  }
})

// Отключаем Telegram в профиле
router.delete('/link', authMiddleware, async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.telegramLinkToken.deleteMany({
        where: { userId: req.user.id },
      }),
      prisma.telegramLink.deleteMany({
        where: { userId: req.user.id },
      }),
    ])

    res.json({ linked: false })
  } catch (error) {
    console.error('Telegram unlink:', error)
    res.status(500).json({ message: 'Не удалось отключить Telegram' })
  }
})


/**
 * Получение заказов пользователя через Telegram.
 * Доступ разрешён только нашему Python-боту.
 */
router.post('/orders', botAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store')

  const telegramUserId = req.body?.telegramUserId

  if (
    typeof telegramUserId !== 'string' ||
    !/^[1-9]\d{0,19}$/.test(telegramUserId)
  ) {
    return res.status(400).json({
      message: 'Некорректный Telegram ID',
    })
  }

  const telegramId = BigInt(telegramUserId)

  if (telegramId > 9223372036854775807n) {
    return res.status(400).json({
      message: 'Некорректный Telegram ID',
    })
  }

  try {
    // Определяем владельца привязанного Telegram
    const link = await prisma.telegramLink.findUnique({
      where: {
        telegramUserId: telegramId,
      },
      select: {
        userId: true,
      },
    })

    if (!link) {
      return res.status(404).json({
        code: 'TELEGRAM_NOT_LINKED',
        message: 'Telegram не привязан к аккаунту',
      })
    }

    // Получаем только заказы этого пользователя
    const orders = await prisma.order.findMany({
      where: {
        userId: link.userId,
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: 20,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            gameTitle: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    })

    res.json({ orders })
  } catch (error) {
    console.error('Ошибка Telegram orders:', error)

    res.status(500).json({
      message: 'Не удалось получить заказы',
    })
  }
})


module.exports = router
