import { Link } from 'react-router-dom'
import './NotFoundPage.css'

/** Страница для неизвестных URL с переходом обратно на главную. */
function NotFoundPage() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <span className="section-label">ПОХОЖЕ, МЫ ЗАБЛУДИЛИСЬ</span>
      <p className="not-found-code" aria-hidden="true">404</p>
      <h1 id="not-found-title">Страница не найдена</h1>
      <p className="not-found-description">
        Такой страницы нет. Возможно, ссылка устарела или адрес указан с ошибкой.
      </p>
      <Link to="/" className="primary-button">
        Вернуться на главную
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}

export default NotFoundPage
