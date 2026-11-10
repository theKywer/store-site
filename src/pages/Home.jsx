
import { useMemo, useState } from 'react'
import GameCard from '../components/GameCard'

function Home({ games, onAddToCart }) {
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('Все жанры')
  const [selectedAge, setSelectedAge] = useState('Любой возраст')
  const [sortOrder, setSortOrder] = useState('default')

  const genres = [
    'Все жанры',
    ...new Set(games.map((game) => game.genre)),
  ]

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
          <span className="hero-label">ТВОЙ МИР ИГР</span>

          <h1>
            Открой для себя
            <br />
            <span>новые миры.</span>
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

      <section className="catalog-section" id="catalog">
        <span className="section-label">
          НАЧНИ СВОЁ ПУТЕШЕСТВИЕ
        </span>

        <h2>Твоя следующая любимая игра</h2>

        <div className="catalog-filters">
          <div className="search-field">
            <input
              type="search"
              placeholder="Поиск игр..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

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
          Найдено игр: {filteredGames.length}
        </div>

        {filteredGames.length > 0 ? (
          <div className="games-grid">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onAddToCart={onAddToCart}
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
