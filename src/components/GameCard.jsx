
import { Link } from 'react-router-dom'

function GameCard({ game, onAddToCart }) {
  const hasDiscount =
    game.discount > 0 &&
    game.oldPrice > game.price

  return (
    <article className="game-card">
      <div className="game-card-image">
        <img src={game.image} alt={game.title} />

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
