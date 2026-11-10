
function GameCard({ game, onAddToCart }) {
  return (
    <article className="game-card">
      <div className="game-card-image">
        <img src={game.image} alt={game.title} />

        <span>{game.genre}</span>
      </div>

      <div className="game-card-content">
        <div className="game-card-meta">
          <span>{game.platform}</span>
          <span className="age-rating">{game.ageRating}</span>
        </div>

        <h3>{game.title}</h3>

        <p>{game.description}</p>

        <div className="game-card-footer">
          <strong>{game.price.toLocaleString('ru-RU')} ₸</strong>

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
