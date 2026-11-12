
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './GamePage.css'

function GamePage({ games, onAddToCart, favoriteIds, onToggleFavorite }) {
  const { id } = useParams()
  const game = games.find((game) => game.id === Number(id))
  const isFavorite = game ? favoriteIds.includes(game.id) : false
  const [mediaState, setMediaState] = useState({ gameId: null, items: [] })
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const media = mediaState.gameId === game?.id ? mediaState.items : []
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
  const officialTrailerGallery = game?.officialTrailerId
    ? [
        {
          type: 'youtube',
          src: `https://www.youtube-nocookie.com/embed/${game.officialTrailerId}`,
          thumbnail: `https://img.youtube.com/vi/${game.officialTrailerId}/maxresdefault.jpg`,
          alt: `${game.title} — официальный трейлер`,
        },
        ...[
          'maxres1.jpg',
          'maxres2.jpg',
          'maxres3.jpg',
          'maxresdefault.jpg',
          'hq720.jpg',
        ].map((frame, index) => ({
            type: 'image',
            src: `https://img.youtube.com/vi/${game.officialTrailerId}/${frame}`,
            thumbnail: `https://img.youtube.com/vi/${game.officialTrailerId}/${frame}`,
            alt: `${game.title} — кадр ${index + 1} официального трейлера`,
          })),
      ]
    : []
  const galleryMedia = game?.gallery?.length
    ? [...game.gallery, ...officialTrailerGallery.slice(1, 5)]
    : officialTrailerGallery.length > 0
      ? officialTrailerGallery
    : media.length > 0
      ? media
      : fallbackMedia
  const visibleMediaIndex = galleryMedia[activeMediaIndex] ? activeMediaIndex : 0

  useEffect(() => {
    if (!game) return
    if (game.gallery?.length || game.officialTrailerId) return

    if (!steamAppId) return

    const controller = new AbortController()

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

        setMediaState({
          gameId: game.id,
          items: [...trailers.slice(0, 1), ...screenshots],
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setMediaState({ gameId: game.id, items: [] })
        }
      })

    return () => controller.abort()
  }, [game, steamAppId])

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
            {galleryMedia[visibleMediaIndex]?.type === 'youtube' ? (
              <iframe
                className="game-page-image game-page-video-embed"
                src={galleryMedia[visibleMediaIndex].src}
                title={galleryMedia[visibleMediaIndex].alt}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : galleryMedia[visibleMediaIndex]?.type === 'video' ? (
              <video
                className="game-page-image"
                src={galleryMedia[visibleMediaIndex].src}
                poster={galleryMedia[visibleMediaIndex].thumbnail}
                controls
                playsInline
                preload="metadata"
                aria-label={galleryMedia[visibleMediaIndex].alt}
              />
            ) : (
              <img
                key={`${visibleMediaIndex}-${galleryMedia[visibleMediaIndex]?.src}`}
                className="game-page-image"
                src={galleryMedia[visibleMediaIndex]?.src ?? game.image}
                alt={galleryMedia[visibleMediaIndex]?.alt ?? game.title}
                onError={(event) => {
                  const image = event.currentTarget
                  if (image.src.includes('img.youtube.com')) {
                    const frameBase = galleryMedia[visibleMediaIndex].src.replace(
                      /\/[^/]+$/,
                      '/',
                    )
                    if (!image.dataset.fallback) {
                      image.dataset.fallback = 'maxres'
                      image.src = `${frameBase}maxresdefault.jpg`
                      return
                    }
                    if (image.dataset.fallback === 'maxres') {
                      image.dataset.fallback = 'hq'
                      image.src = `${frameBase}hqdefault.jpg`
                      return
                    }
                  }
                  image.hidden = true
                }}
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
                  className={`game-page-gallery-item${index === visibleMediaIndex ? ' is-active' : ''}`}
                  key={`${item.type}-${item.src}`}
                  type="button"
                  onClick={() => setActiveMediaIndex(index)}
                  aria-label={
                    item.type === 'video' || item.type === 'youtube'
                      ? 'Воспроизвести трейлер'
                      : `Показать скриншот ${index}`
                  }
                  aria-pressed={index === visibleMediaIndex}
                >
                  <img
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      const image = event.currentTarget
                      if (image.src.includes('img.youtube.com')) {
                        const frameBase = item.src.replace(/\/[^/]+$/, '/')
                        if (!image.dataset.fallback) {
                          image.dataset.fallback = 'maxres'
                          image.src = `${frameBase}maxresdefault.jpg`
                          return
                        }
                        if (image.dataset.fallback === 'maxres') {
                          image.dataset.fallback = 'hq'
                          image.src = `${frameBase}hqdefault.jpg`
                          return
                        }
                      }
                      image.closest('button').hidden = true
                    }}
                  />
                  {(item.type === 'video' || item.type === 'youtube') && (
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

          <div className="game-page-title-row">
            <h1>{game.title}</h1>
            <button
              type="button"
              className={`favorite-toggle game-page-favorite${isFavorite ? ' is-favorite' : ''}`}
              onClick={() => onToggleFavorite(game.id)}
              aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              aria-pressed={isFavorite}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>
            </button>
          </div>

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
