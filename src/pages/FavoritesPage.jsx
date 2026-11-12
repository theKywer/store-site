import { Link } from 'react-router-dom'
import GameCard from '../components/GameCard'

function FavoritesPage({ games, favoriteIds, onToggleFavorite, onAddToCart }) {
  const favoriteGames = games.filter((game) => favoriteIds.includes(game.id))

  return (
    <section className="favorites-page catalog-section">
      <span className="section-label">ТВОЯ КОЛЛЕКЦИЯ</span>
      <h1>Избранное</h1>
      <p className="favorites-description">
        Игры, которые ты сохранил на потом.
      </p>

      {favoriteGames.length > 0 ? (
        <div className="games-grid">
          {favoriteGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onAddToCart={onAddToCart}
              isFavorite
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty-favorites">
          <span className="empty-favorites-heart" aria-hidden="true">♡</span>
          <h2>Пока здесь пусто</h2>
          <p>Нажми на сердечко у игры, чтобы сохранить её в избранное.</p>
          <Link to="/#catalog" className="primary-button">
            Открыть каталог
          </Link>
        </div>
      )}
    </section>
  )
}

export default FavoritesPage
