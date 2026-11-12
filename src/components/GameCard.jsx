
import { Link } from 'react-router-dom'

function GameCard({ game, onAddToCart, isFavorite, onToggleFavorite }) {
  const hasDiscount =
    game.discount > 0 &&
    game.oldPrice > game.price

  return (
    <article className="game-card">
      <div className="game-card-image">
        <img src={game.image} alt={game.title} />

        <button
          type="button"
          className={`favorite-toggle${isFavorite ? ' is-favorite' : ''}`}
          onClick={() => onToggleFavorite(game.id)}
          aria-label={isFavorite ? `Убрать ${game.title} из избранного` : `Добавить ${game.title} в избранное`}
          aria-pressed={isFavorite}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </button>

        {game.badge && (
          <span className="game-card-badge">
            {game.badge}
          </span>
        )}

        {hasDiscount && (
          <span className="game-card-discount">
            -{game.discount}%
          </span>
        )}

        <span className="game-card-genre">
          {game.genre}
        </span>
      </div>

      <div className="game-card-content">
        <div className="game-card-meta">
          <span>{game.platform}</span>
          <span className="age-rating">
            {game.ageRating}
          </span>
        </div>

        <h3>
          <Link to={`/game/${game.id}`}>
            {game.title}
          </Link>
        </h3>

        <p>{game.description}</p>

        <div className="game-card-footer">
          <div className="game-card-price">
            {hasDiscount && (
              <span className="game-card-old-price">
                {game.oldPrice.toLocaleString('ru-RU')} ₸
              </span>
            )}

            <strong>
              {game.price.toLocaleString('ru-RU')} ₸
            </strong>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(game)}
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  )
}

export default GameCard
