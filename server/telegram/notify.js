
const prisma = require('../prisma')

const TELEGRAM_TIMEOUT_MS = 5000

// Форматирование цен
function formatPrice(value) {
  if (!Number.isSafeInteger(value)) {
    return 'Не указана'
  }

  return `${new Intl.NumberFormat('ru-RU').format(value)} ₸`
}

// Создание текста уведомления
function formatOrderNotification(order) {
  const statuses = {
    PENDING: {
      title: '📦 Заказ успешно создан!',
      description: '⏳ Ожидает оплаты',
    },
    PAID: {
      title: '🎉 Заказ успешно оплачен!',
      description: '✅ Оплата подтверждена',
    },
    CANCELLED: {
      title: '❌ Заказ отменён',
      description: '📌 Статус: Отменён',
    },
  }

  const status = statuses[order.status]

  if (!status) return null

  const lines = [
    '🌙 Luna Market',
    '',
    status.title,
    '',
    `📦 Номер заказа: #${order.id}`,
    `📌 Текущий статус: ${status.description}`,
    `💰 Общая сумма: ${formatPrice(order.totalAmount)}`,
  ]

  // Показываем купленные игры, но не секретные ключи
  if (Array.isArray(order.items) && order.items.length > 0) {
    lines.push('', '🎮 Игры:')

    for (const item of order.items) {
      const title = String(item.gameTitle || 'Игра')
        .slice(0, 100)

      lines.push(`• ${title} × ${item.quantity}`)
    }

  }

  if (order.status === 'PAID') {
    lines.push(
      '',
      'Ваши игры доступны в личном кабинете Luna Market.'
    )
  }

  lines.push('', '📦 История заказов: /orders')

  return lines.join('\n')
}

// Отправка уведомления пользователю
async function notifyTelegramOrder(order) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.warn('Telegram: токен бота не настроен')
    return
  }

  if (!Number.isSafeInteger(order?.userId)) {
    return
  }

  try {
    // Находим Telegram ID владельца заказа
    const link = await prisma.telegramLink.findUnique({
      where: {
        userId: order.userId,
      },
      select: {
        telegramUserId: true,
        notifyOrders: true,
      },
    })

    // Если Telegram не привязан — ничего не отправляем
    if (!link) return
    if (!link.notifyOrders) return

    const text = formatOrderNotification(order)

    if (!text) return

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: link.telegramUserId.toString(),
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      }
    )

    if (!response.ok) {
      console.warn(
        `Telegram: уведомление не отправлено, HTTP ${response.status}`
      )
      return
    }

    const result = await response.json()

    if (!result.ok) {
      console.warn('Telegram: API отклонил уведомление')
      return
    }

    console.log(
      `Telegram: уведомление о заказе #${order.id} отправлено`
    )
  } catch (error) {
    // Ошибка Telegram не должна влиять на покупку
    console.error(
      'Telegram: ошибка отправки уведомления',
      error.name || 'UnknownError'
    )
  }
}

module.exports = {
  notifyTelegramOrder,
}
