
import { useParams, Link } from 'react-router-dom'
import './GamePage.css'

function GamePage({ games, onAddToCart }) {
  const { id } = useParams()

  const game = games.find((game) => game.id === Number(id))

  if (!game) {
    return (
      <section className="info-page">
        <h1>Игра не найдена</h1>
        <Link to="/">Вернуться в каталог</Link>
      </section>
    )
  }

  return (
    <section className="game-page">
      <Link to="/#catalog" className="back-link">
        ← Вернуться в каталог
      </Link>

      <div className="game-page-content">
        <img
          className="game-page-image"
          src={game.image}
          alt={game.title}
        />

        <div className="game-page-info">
          <span className="section-label">{game.genre}</span>

          <h1>{game.title}</h1>

          <p>{game.description}</p>

          <div className="game-page-meta">
            <div>
              <span>Разработчик</span>
              <strong>{game.developer}</strong>
            </div>

            <div>
              <span>Издатель</span>
              <strong>{game.publisher}</strong>
            </div>

            <div>
              <span>Дата выхода</span>
              <strong>{game.releaseDate}</strong>
            </div>

            <div>
              <span>Платформа</span>
              <strong>{game.platform}</strong>
            </div>

            <div>
              <span>Возрастной рейтинг</span>
              <strong>{game.ageRating}</strong>
            </div>
          </div>

          <div className="game-page-purchase">
            <strong>{game.price.toLocaleString('ru-RU')} ₸</strong>

            <button onClick={() => onAddToCart(game)}>
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GamePage
