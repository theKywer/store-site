
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-about">
          <Link to="/" className="footer-logo">
            <span className="logo-icon">L</span>
            <span>LUNA MARKET</span>
          </Link>

          <p>
            Твой мир игр начинается здесь.
            Открывай новые вселенные, находи любимые
            истории и собирай свою игровую коллекцию.
          </p>
        </div>

        <div className="footer-column">
          <h3>Навигация</h3>
          <Link to="/">Главная</Link>
          <Link to="/#catalog">Каталог</Link>
          <Link to="/cart">Корзина</Link>
        </div>

        <div className="footer-column">
          <h3>Информация</h3>
          <Link to="/about">О нас</Link>
          <Link to="/support">Поддержка</Link>
          <Link to="/legal">Правовая информация</Link>
        </div>

        <div className="footer-socials">
          <h3>Мы в сети</h3>

          <div className="social-links">
            <a
              href="https://github.com/theKywer"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.76 2.34 3.03 1.78.1-.71.39-1.2.7-1.48-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.27-2.61 5.21-5.09 5.49.4.35.75 1.02.75 2.06v3.06c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"
                />
              </svg>
            </a>

            <a
              href="https://www.instagram.com/your_username/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              title="Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"
                />
              </svg>
            </a>

            <a
              href="https://t.me/your_username"
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram"
              title="Telegram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.8 4.2 18.5 20c-.25 1.12-.91 1.4-1.85.87l-5.1-3.76-2.46 2.37c-.27.27-.5.5-1.02.5l.37-5.2 9.47-8.56c.41-.37-.09-.58-.63-.21L5.57 13.4.53 11.82c-1.1-.35-1.12-1.1.23-1.62L20.5 2.65c.91-.33 1.71.22 1.3 1.55Z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Luna Market. Все права защищены.</span>
        <span>Учебный проект. Реальные покупки недоступны.</span>
      </div>
    </footer>
  )
}

export default Footer
