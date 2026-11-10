
function GameCard({ game, onAddToCart }) {
  return (
    <article className="game-card">
      <div className="game-card-image">
        <span>{game.genre}</span>
      </div>

      <div className="game-card-content">
        <h3>{game.title}</h3>

        <p>{game.description}</p>

        <div className="game-card-footer">
          <strong>{game.price} ₸</strong>

          <button type="button" onClick={onAddToCart}>
            В корзину
          </button>
        </div>
      </div>
    </article>
  )
}

export default GameCard
