
import { useMemo, useState } from 'react'
import GameCard from '../components/GameCard'
import TelegramBanner from '../components/TelegramBanner'

/** Главная страница: поиск, фильтры, сортировка и каталог игр. */
function Home({ games, isLoading, error, onAddToCart, favoriteIds, onToggleFavorite }) {
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('Все жанры')
  const [selectedAge, setSelectedAge] = useState('Любой возраст')
  const [sortOrder, setSortOrder] = useState('default')

  // Формирует варианты жанров без дубликатов из текущего списка игр.
  const genres = [
    'Все жанры',
    ...new Set(games.map((game) => game.genre)),
  ]

  // Применяет поиск, фильтры и выбранный порядок к каталогу.
  const filteredGames = useMemo(() => {
    let result = games.filter((game) => {
      const searchText = search.toLowerCase().trim()

      const matchesSearch =
        game.title.toLowerCase().includes(searchText) ||
        game.genre.toLowerCase().includes(searchText) ||
        game.description.toLowerCase().includes(searchText)

      const matchesGenre =
        selectedGenre === 'Все жанры' ||
        game.genre === selectedGenre

      const matchesAge =
        selectedAge === 'Любой возраст' ||
        game.ageRating === selectedAge

      return matchesSearch && matchesGenre && matchesAge
    })

    if (sortOrder === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price)
    }

    if (sortOrder === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price)
    }

    if (sortOrder === 'name') {
      result = [...result].sort((a, b) =>
        a.title.localeCompare(b.title, 'ru')
      )
    }

    return result
  }, [games, search, selectedGenre, selectedAge, sortOrder])

  /** Возвращает каталог к исходным фильтрам и сортировке. */
  function resetFilters() {
    setSearch('')
    setSelectedGenre('Все жанры')
    setSelectedAge('Любой возраст')
    setSortOrder('default')
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-label">
            <span className="hero-label-mark" aria-hidden="true">✦</span>
            Своя орбита, свои игры
          </span>

          <h1>
            Выбирай мир.
            <br />
            <span>Начинай приключение.</span>
          </h1>

          <p className="hero-description">
            Игры, которые захватывают.
            Истории, которые остаются с тобой.
            Всё это — в Luna Market.
          </p>

          <a href="#catalog" className="primary-button">
            Смотреть каталог
            <span>→</span>
          </a>
        </div>
      </section>

      <TelegramBanner />

      <section className="catalog-section" id="discounts">
        <span className="section-label">
          НАЧНИ СВОЁ ПУТЕШЕСТВИЕ
        </span>

        <h2 id="catalog">Твоя следующая любимая игра</h2>

        <div className="catalog-filters">
          <div className="search-field">
            {/* Поисковый ввод обновляет строку, участвующую в фильтрации. */}
            <input
              type="search"
              placeholder="Поиск игр..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {/* Жанр оставляет только совпадающие игры. */}
          <select
            value={selectedGenre}
            onChange={(event) => setSelectedGenre(event.target.value)}
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          {/* Возрастной рейтинг ограничивает выдачу каталога. */}
          <select
            value={selectedAge}
            onChange={(event) => setSelectedAge(event.target.value)}
          >
            <option value="Любой возраст">Любой возраст</option>
            <option value="0+">0+</option>
            <option value="6+">6+</option>
            <option value="12+">12+</option>
            <option value="16+">16+</option>
            <option value="18+">18+</option>
          </select>

          {/* Выбор меняет порядок игр после применения фильтров. */}
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="default">Сначала рекомендуемые</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
            <option value="name">По названию</option>
          </select>

          <button
            type="button"
            className="reset-filters"
            onClick={resetFilters}
          >
            Сбросить
          </button>
        </div>

        <div className="catalog-results">
          {isLoading ? 'Загружаем каталог…' : error ? 'Каталог временно недоступен' : `Найдено игр: ${filteredGames.length}`}
        </div>

        {isLoading ? (
          <div className="catalog-state" role="status">
            <span className="ui-spinner" aria-hidden="true" />
            Загружаем игры…
          </div>
        ) : error ? (
          <div className="catalog-state is-error" role="alert">
            <h3>Не удалось загрузить каталог</h3>
            <p>{error}</p>
            <button type="button" className="catalog-state-link" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="games-grid">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onAddToCart={onAddToCart}
                isFavorite={favoriteIds.includes(game.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <h3>Ничего не найдено</h3>
            <p>Попробуй изменить запрос или параметры фильтрации.</p>
            <button type="button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </section>
    </>
  )
}

export default Home
