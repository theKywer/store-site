
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './GamePage.css'

function GamePage({ games, onAddToCart }) {
  const { id } = useParams()
  const game = games.find((game) => game.id === Number(id))
  const [media, setMedia] = useState([])
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const steamAppId = game?.image.match(/\/apps\/(\d+)/)?.[1]
  const fallbackMedia = steamAppId
    ? [
        { type: 'image', src: game.image, thumbnail: game.image, alt: game.title },
        ...['library_hero.jpg', 'capsule_616x353.jpg', 'library_600x900.jpg'].map(
          (file) => ({
            type: 'image',
            src: `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/${file}`,
            thumbnail: `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/${file}`,
            alt: `${game.title} — арт`,
          }),
        ),
      ]
    : [{ type: 'image', src: game?.image, thumbnail: game?.image, alt: game?.title }]
  const galleryMedia = media.length > 0 ? media : fallbackMedia

  useEffect(() => {
    if (!game) return

    if (!steamAppId) {
      setMedia([])
      return
    }

    const controller = new AbortController()
    setActiveMediaIndex(0)

    fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&l=english`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error('Не удалось загрузить медиа игры')
        return response.json()
      })
      .then((result) => {
        const details = result[steamAppId]?.data
        if (!details) return

        const screenshots = (details.screenshots ?? []).map((screenshot) => ({
          type: 'image',
          thumbnail: screenshot.path_thumbnail,
          src: screenshot.path_full,
          alt: `${game.title} — скриншот`,
        }))
        const trailers = (details.movies ?? [])
          .map((movie) => ({
            type: 'video',
            thumbnail: movie.thumbnail,
            src:
              movie.webm?.max ??
              movie.webm?.['480'] ??
              movie.mp4?.max ??
              movie.mp4?.['480'],
            alt: movie.name || `Трейлер ${game.title}`,
          }))
          .filter((item) => item.src)

        setMedia([...trailers.slice(0, 1), ...screenshots])
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setMedia([])
      })

    return () => controller.abort()
  }, [game])

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
        <div className="game-page-gallery">
          <div className="game-page-image-wrapper">
            {galleryMedia[activeMediaIndex]?.type === 'video' ? (
              <video
                className="game-page-image"
                src={galleryMedia[activeMediaIndex].src}
                poster={galleryMedia[activeMediaIndex].thumbnail}
                controls
                playsInline
                preload="metadata"
                aria-label={galleryMedia[activeMediaIndex].alt}
              />
            ) : (
              <img
                className="game-page-image"
                src={galleryMedia[activeMediaIndex]?.src ?? game.image}
                alt={galleryMedia[activeMediaIndex]?.alt ?? game.title}
              />
            )}
            {game.badge && (
              <span className="game-page-badge">{game.badge}</span>
            )}
            {game.discount > 0 && (
              <span className="game-page-discount">-{game.discount}%</span>
            )}
          </div>
          {galleryMedia.length > 0 && (
            <div className="game-page-gallery-strip" aria-label="Галерея игры">
              {galleryMedia.map((item, index) => (
                <button
                  className={`game-page-gallery-item${index === activeMediaIndex ? ' is-active' : ''}`}
                  key={`${item.type}-${item.src}`}
                  type="button"
                  onClick={() => setActiveMediaIndex(index)}
                  aria-label={
                    item.type === 'video'
                      ? 'Воспроизвести трейлер'
                      : `Показать скриншот ${index}`
                  }
                  aria-pressed={index === activeMediaIndex}
                >
                  <img
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.closest('button').hidden = true
                    }}
                  />
                  {item.type === 'video' && (
                    <span className="game-page-play-icon" aria-hidden="true">
                      ▶
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

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
            <div className="game-page-price">
              {game.discount > 0 && game.oldPrice > game.price && (
                <span className="game-page-old-price">
                  {game.oldPrice.toLocaleString('ru-RU')} ₸
                </span>
              )}
              <strong>{game.price.toLocaleString('ru-RU')} ₸</strong>
            </div>

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
