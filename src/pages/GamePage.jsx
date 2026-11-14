
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import './GamePage.css'

// Получает YouTube ID из ссылки или возвращает переданный ID.
function getYouTubeId(value) {
  if (!value) return null

  const input = value.trim()

  if (!input) return null

  const match = input.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )

  if (match) return match[1]

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input
  }

  return null
}

// Проверяет, является ли видео YouTube-видео.
function isYouTubeVideo(media) {
  return (
    (media.type === 'video' || media.type === 'youtube') &&
    Boolean(getYouTubeId(media.src))
  )
}

// Создаёт адрес YouTube-плеера.
function getYouTubeEmbedUrl(src) {
  const videoId = getYouTubeId(src)

  return videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : ''
}

function getYouTubeThumbnail(src) {
  const videoId = getYouTubeId(src)

  return videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : ''
}

function GamePage({ games, onAddToCart, favoriteIds, onToggleFavorite }) {
  const { id } = useParams()

  const game = games.find((item) => item.id === Number(id))

  const isFavorite = game
    ? favoriteIds.includes(game.id)
    : false

  const [mediaState, setMediaState] = useState({
    gameId: null,
    items: [],
  })

  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  const media = mediaState.gameId === game?.id
    ? mediaState.items
    : []

  // Получаем Steam App ID из адреса обложки.
  const steamAppId = game?.image.match(/\/apps\/(\d+)/)?.[1]

  // Запасная галерея Steam.
  const fallbackMedia = game
    ? steamAppId
      ? [
          {
            type: 'image',
            src: game.image,
            thumbnail: game.image,
            alt: game.title,
          },
          ...[
            'library_hero.jpg',
            'capsule_616x353.jpg',
            'library_600x900.jpg',
          ].map((file) => {
            const url = `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/${file}`

            return {
              type: 'image',
              src: url,
              thumbnail: url,
              alt: `${game.title} — арт`,
            }
          }),
        ]
      : [
          {
            type: 'image',
            src: game.image,
            thumbnail: game.image,
            alt: game.title,
          },
        ]
    : []

  // Галерея официального трейлера YouTube.
  const officialTrailerGallery = game?.officialTrailerId
    ? [
        {
          type: 'youtube',
          src: game.officialTrailerId,
          thumbnail: getYouTubeThumbnail(game.officialTrailerId),
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

  // Выбираем галерею в зависимости от доступных данных.
  const galleryMedia = game?.gallery?.length
    ? [
        ...game.gallery,
        ...officialTrailerGallery.slice(1, 5),
      ]
    : officialTrailerGallery.length > 0
      ? officialTrailerGallery
      : media.length > 0
        ? media
        : fallbackMedia

  const visibleMediaIndex = galleryMedia[activeMediaIndex]
    ? activeMediaIndex
    : 0

  const activeMedia = galleryMedia[visibleMediaIndex]

  // Сбрасываем выбранный элемент при переключении игры.
  useEffect(() => {
    setActiveMediaIndex(0)
  }, [game?.id])

  // Загружаем дополнительные материалы Steam.
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
        if (!response.ok) {
          throw new Error('Не удалось загрузить медиа игры')
        }

        return response.json()
      })
      .then((result) => {
        const details = result[steamAppId]?.data

        if (!details) return

        const screenshots = (details.screenshots ?? []).map(
          (screenshot) => ({
            type: 'image',
            thumbnail: screenshot.path_thumbnail,
            src: screenshot.path_full,
            alt: `${game.title} — скриншот`,
          }),
        )

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
          items: [
            ...trailers.slice(0, 1),
            ...screenshots,
          ],
        })
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setMediaState({
            gameId: game.id,
            items: [],
          })
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
            {activeMedia && isYouTubeVideo(activeMedia) ? (
              <iframe
                className="game-page-image game-page-video-embed"
                src={getYouTubeEmbedUrl(activeMedia.src)}
                title={activeMedia.alt || game.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : activeMedia?.type === 'video' ? (
              <video
                key={activeMedia.src}
                className="game-page-image"
                src={activeMedia.src}
                poster={activeMedia.thumbnail || undefined}
                controls
                playsInline
                preload="metadata"
                aria-label={activeMedia.alt || game.title}
              />
            ) : (
              <img
                key={`${visibleMediaIndex}-${activeMedia?.src}`}
                className="game-page-image"
                src={activeMedia?.src || game.image}
                alt={activeMedia?.alt || game.title}
                onError={(event) => {
                  const image = event.currentTarget

                  if (image.dataset.fallbackAttempted) {
                    image.alt = ''
                    return
                  }

                  image.dataset.fallbackAttempted = 'true'
                  if (image.src !== game.image) {
                    image.src = game.image
                  } else {
                    image.alt = ''
                  }
                }}
              />
            )}

            {game.badge && (
              <span className="game-page-badge">
                {game.badge}
              </span>
            )}

            {game.discount > 0 && (
              <span className="game-page-discount">
                -{game.discount}%
              </span>
            )}
          </div>

          {galleryMedia.length > 0 && (
            <div
              className="game-page-gallery-strip"
              aria-label="Галерея игры"
            >
              {galleryMedia.map((item, index) => {
                const youtube = isYouTubeVideo(item)

                const thumbnail =
                  item.thumbnail ||
                  (youtube
                    ? getYouTubeThumbnail(item.src)
                    : item.src)

                return (
                  <button
                    className={`game-page-gallery-item${
                      index === visibleMediaIndex ? ' is-active' : ''
                    }`}
                    key={`${item.type}-${item.src}-${index}`}
                    type="button"
                    onClick={() => setActiveMediaIndex(index)}
                    aria-label={
                      item.type === 'video' || item.type === 'youtube'
                        ? 'Воспроизвести трейлер'
                        : `Показать скриншот ${index + 1}`
                    }
                    aria-pressed={index === visibleMediaIndex}
                  >
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt=""
                        loading="lazy"
                      />
                    )}

                    {(item.type === 'video' || item.type === 'youtube') && (
                      <span
                        className="game-page-play-icon"
                        aria-hidden="true"
                      >
                        ▶
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="game-page-info">
          <span className="section-label">
            {game.genre}
          </span>

          <div className="game-page-title-row">
            <h1>{game.title}</h1>

            <button
              type="button"
              className={`favorite-toggle game-page-favorite${
                isFavorite ? ' is-favorite' : ''
              }`}
              onClick={() => onToggleFavorite(game.id)}
              aria-label={
                isFavorite
                  ? 'Убрать из избранного'
                  : 'Добавить в избранное'
              }
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
              {game.discount > 0 &&
                game.oldPrice > game.price && (
                  <span className="game-page-old-price">
                    {game.oldPrice.toLocaleString('ru-RU')} ₸
                  </span>
                )}

              <strong>
                {game.price.toLocaleString('ru-RU')} ₸
              </strong>
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
