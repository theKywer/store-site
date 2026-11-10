
import { useState } from 'react'
import Header from './components/Header'
import GameCard from './components/GameCard'
import games from './data/game'
import './App.css'

function App() {
  const [cartCount, setCartCount] = useState(0)

  return (
    <>
      <Header cartCount={cartCount} />

      <main>
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

          <div className="games-grid">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onAddToCart={() => {
                  setCartCount((currentCount) => currentCount + 1)
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

export default App
