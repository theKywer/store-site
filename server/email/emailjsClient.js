class EmailDeliveryError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'EmailDeliveryError'
    this.code = code
  }
}

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send'
const EMAILJS_MIN_INTERVAL_MS = 1000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let emailQueue = Promise.resolve()
let lastRequestStartedAt = 0

function getEmailJsConfig() {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim()
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim()
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim()
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim()

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    throw new EmailDeliveryError(
      'EMAIL_SERVICE_NOT_CONFIGURED',
      'Отправка писем не настроена. Укажите EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY и EMAILJS_PRIVATE_KEY.',
    )
  }

  return { serviceId, templateId, publicKey, privateKey }
}

function queueEmailRequest(send) {
  const request = emailQueue.then(async () => {
    const waitMs = Math.max(0, EMAILJS_MIN_INTERVAL_MS - (Date.now() - lastRequestStartedAt))
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    lastRequestStartedAt = Date.now()
    return send()
  })

  // Keep the queue usable after a rejected provider request.
  emailQueue = request.catch(() => undefined)
  return request
}

function getSafeEmailJsErrorReason(responseBody, sensitiveValues = []) {
  let body = typeof responseBody === 'string' ? responseBody.trim() : ''
  if (!body) return 'reason unavailable'

  for (const value of sensitiveValues) {
    if (typeof value === 'string' && value.length > 0) {
      body = body.replaceAll(value, '[redacted]')
    }
  }

  body = body
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
    .replace(/\b(?:verification|confirmation|one-time|otp|auth)?\s*(?:code|token|key)\s*[:=]\s*[^\s,;]+/gi, '[credential redacted]')
    .replace(/\b\d{4,10}\b/g, '[number redacted]')
    .slice(0, 500)

  // EmailJS errors are usually plain text. Only emit known generic diagnostics;
  // never pass provider text through to logs, where it could contain PII/secrets.
  const safeReasons = [
    [/^the service[_ ]id parameter is required\.?$/i, 'service_id parameter is required'],
    [/^the template[_ ]id parameter is required\.?$/i, 'template_id parameter is required'],
    [/^the user[_ ]id parameter is required\.?$/i, 'user_id parameter is required'],
    [/^the public key is invalid\b/i, 'public key is invalid'],
    [/^the private key is invalid\b/i, 'private key is invalid'],
    [/^the service(?: id)? (?:is )?(?:not found|does not exist)\.?$/i, 'service was not found'],
    [/^the template(?: id)? (?:is )?(?:not found|does not exist)\.?$/i, 'template was not found'],
    [/^the recipients? address is empty\.?$/i, 'recipient address is empty'],
    [/^the recipients? address is corrupted\b/i, 'recipient address is invalid'],
    [/^(?:too many requests|rate limit exceeded)\.?$/i, 'rate limit exceeded'],
  ]

  const match = safeReasons.find(([pattern]) => pattern.test(body))
  return match ? match[1] : 'provider returned an unrecognized error (details omitted)'
}

async function sendVerificationEmail(recipient, code) {
  const normalizedRecipient = typeof recipient === 'string'
    ? recipient.trim().toLowerCase()
    : ''

  if (!EMAIL_PATTERN.test(normalizedRecipient)) {
    throw new EmailDeliveryError(
      'EMAIL_RECIPIENT_INVALID',
      'Не удалось отправить письмо: адрес получателя отсутствует или некорректен.',
    )
  }

  const { serviceId, templateId, publicKey, privateKey } = getEmailJsConfig()

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      email: normalizedRecipient,
      to_email: normalizedRecipient,
      verification_code: code,
    },
  }

  return queueEmailRequest(async () => {
    let response
    try {
      response = await fetch(EMAILJS_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      throw new EmailDeliveryError(
        'EMAIL_SEND_FAILED',
        'Не удалось связаться с почтовым сервисом. Попробуйте позже.',
      )
    }

    if (!response.ok) {
      let responseBody = ''
      try {
        responseBody = await response.text()
      } catch {
        // Keep the status diagnostic even if the response body cannot be read.
      }
      const reason = getSafeEmailJsErrorReason(responseBody, [
        normalizedRecipient,
        code,
        publicKey,
        privateKey,
        serviceId,
        templateId,
      ])

      if (response.status === 429) {
        console.error(`EmailJS email request failed (HTTP ${response.status}): ${reason}`)
        throw new EmailDeliveryError(
          'EMAIL_SEND_FAILED',
          'Почтовый сервис временно ограничил отправку. Попробуйте запросить код позже.',
        )
      }

      console.error(`EmailJS email request failed (HTTP ${response.status}): ${reason}`)
      throw new EmailDeliveryError(
        'EMAIL_SEND_FAILED',
        'Почтовый сервис не принял письмо. Проверьте настройки EmailJS и попробуйте позже.',
      )
    }
  })
}

module.exports = { EmailDeliveryError, getEmailJsConfig, sendVerificationEmail }
