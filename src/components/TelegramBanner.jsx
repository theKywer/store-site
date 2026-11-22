import './TelegramBanner.css'

export default function TelegramBanner() {
  return (
    <div className="telegram-banner-wrap">
      <a
        className="telegram-banner"
        href="https://t.me/LunaMarketGameBot"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Открыть Telegram-бот Luna Market в новой вкладке"
      >
        <svg
          className="telegram-banner-icon"
          viewBox="0 0 48 48"
          role="img"
          aria-label="Telegram"
        >
          <circle cx="24" cy="24" r="24" fill="currentColor" />
          <path
            d="m35.9 14.2-4 20c-.3 1.4-1.1 1.7-2.3 1.1l-6.5-4.8-3.1 3c-.3.3-.6.6-1.2.6l.5-6.6 12-10.8c.5-.5-.1-.7-.7-.3L15.8 26l-6.4-2c-1.4-.4-1.4-1.4.3-2L34.5 13c1.2-.4 2.2.3 1.4 1.2Z"
            fill="#fff"
          />
        </svg>

        <span className="telegram-banner-copy">
          <strong>🌙 Luna Market теперь в Telegram!</strong>
          <span>Каталог игр, заказы и уведомления — прямо в Telegram</span>
        </span>

        <span className="telegram-banner-action" aria-hidden="true">
          Перейти <span>→</span>
        </span>
      </a>
    </div>
  )
}
