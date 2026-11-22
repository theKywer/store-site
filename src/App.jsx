
import './App.css'
import { apiFetch } from './api'

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

import Home from './pages/Home'
import CartPage from './pages/CartPage'
import AboutPage from './pages/AboutPage'
import SupportPage from './pages/SupportPage'
import LegalPage from './pages/LegalPage'
import GamePage from './pages/GamePage'
import FavoritesPage from './pages/FavoritesPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import CheckoutPage from './pages/CheckoutPage'
import MyOrdersPage from './pages/MyOrdersPage'
import RequireAdmin from './components/RequireAdmin'
import RequireAuth from './components/RequireAuth'
import ProfilePage from './pages/ProfilePage'

import ToastViewport from './components/ToastViewport'

function App() {
  const [games, setGames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCatalogLoaded, setIsCatalogLoaded] = useState(false)
  const [error, setError] = useState(null)

  const [toasts, setToasts] = useState([])

  const [favoriteIds, setFavoriteIds] = useState([])
  const [cartItems, setCartItems] = useState([])

  // Загрузка игр с сервера и восстановление localStorage
  useEffect(() => {
    async function getGames() {
      try {
        const response = await apiFetch('/api/games')

        if (!response.ok) {
          throw new Error('Не удалось загрузить игры')
        }

        const data = await response.json()

        setGames(data)

        // Восстанавливаем избранное
        try {
          const savedFavorites = JSON.parse(
            localStorage.getItem('favoriteGameIds') || '[]',
          )

          if (Array.isArray(savedFavorites)) {
            const validFavorites = [...new Set(savedFavorites.map(Number))]
              .filter((id) => data.some((game) => game.id === id))

            setFavoriteIds(validFavorites)
          }
        } catch {
          setFavoriteIds([])
        }

        // Восстанавливаем корзину
        try {
          const savedCart = JSON.parse(
            localStorage.getItem('cartItems') || '[]',
          )

          if (Array.isArray(savedCart)) {
            const restoredCart = savedCart.reduce((cart, item) => {
              if (!item || typeof item !== 'object') return cart

              const savedGame = item.game ?? item
              const gameId = Number(savedGame?.id)

              const game = data.find((entry) => entry.id === gameId)

              if (!game) return cart

              const savedQuantity = item.game ? Number(item.quantity) : 1

              const quantity =
                Number.isFinite(savedQuantity) && savedQuantity > 0
                  ? Math.max(1, Math.floor(savedQuantity))
                  : 1

              const existingItem = cart.find(
                (cartItem) => cartItem.game.id === game.id,
              )

              if (existingItem) {
                existingItem.quantity += quantity
              } else {
                cart.push({ game, quantity })
              }

              return cart
            }, [])

            setCartItems(restoredCart)
          }
        } catch {
          setCartItems([])
        }

        setIsCatalogLoaded(true)
      } catch (error) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    getGames()
  }, [])

  // Сохранение корзины
  useEffect(() => {
    if (!isCatalogLoaded) return

    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems))
    } catch {
      // Корзина продолжит работать в текущей сессии.
    }
  }, [cartItems, isCatalogLoaded])

  // Сохранение избранного
  useEffect(() => {
    if (!isCatalogLoaded) return

    try {
      localStorage.setItem('favoriteGameIds', JSON.stringify(favoriteIds))
    } catch {
      // Избранное продолжит работать в текущей сессии.
    }
  }, [favoriteIds, isCatalogLoaded])

  // Уведомления
  function notify(message, type = 'cart') {
    const id = `${Date.now()}-${Math.random()}`

    setToasts((currentToasts) => [
      ...currentToasts.slice(-3),
      { id, message, type, isLeaving: false },
    ])

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.map((toast) =>
          toast.id === id ? { ...toast, isLeaving: true } : toast,
        ),
      )
    }, 2700)

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      )
    }, 3050)
  }

  function dismissToast(toastId) {
    setToasts((currentToasts) =>
      currentToasts.map((toast) =>
        toast.id === toastId ? { ...toast, isLeaving: true } : toast,
      ),
    )

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== toastId),
      )
    }, 350)
  }

  // Избранное
  function toggleFavorite(gameId) {
    const willBeFavorite = !favoriteIds.includes(gameId)
    const gameTitle = games.find((game) => game.id === gameId)?.title

    setFavoriteIds((currentIds) =>
      currentIds.includes(gameId)
        ? currentIds.filter((id) => id !== gameId)
        : [...currentIds, gameId],
    )

    notify(
      willBeFavorite
        ? `«${gameTitle}» добавлена в избранное`
        : `«${gameTitle}» удалена из избранного`,
      'favorite',
    )
  }

  // Корзина
  function addToCart(game) {
    const isAlreadyInCart = cartItems.some(
      (item) => item.game.id === game.id,
    )

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.game.id === game.id,
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.game.id === game.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentItems, { game, quantity: 1 }]
    })

    notify(
      isAlreadyInCart
        ? `Количество игры «${game.title}» увеличено`
        : `«${game.title}» добавлена в корзину`,
      'cart',
    )
  }

  function increaseQuantity(gameId) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.game.id === gameId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    )
  }

  function decreaseQuantity(gameId) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.game.id === gameId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function removeFromCart(gameId) {
    const removedGame = cartItems.find(
      (item) => item.game.id === gameId,
    )?.game

    setCartItems((currentItems) =>
      currentItems.filter((item) => item.game.id !== gameId),
    )

    if (removedGame) {
      notify(`«${removedGame.title}» удалена из корзины`, 'cart')
    }
  }

  // Удаление игры из корзины и избранного после удаления из каталога
  function handleGameDeleted(gameId) {
    setFavoriteIds((currentIds) =>
      currentIds.filter((id) => id !== gameId),
    )

    setCartItems((currentItems) =>
      currentItems.filter((item) => item.game.id !== gameId),
    )
  }

  // Обновление игры в корзине после редактирования
  function handleGamesChange(updateGames) {
    const nextGames = typeof updateGames === 'function'
      ? updateGames(games)
      : updateGames

    setGames(nextGames)

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        const updatedGame = nextGames.find(
          (game) => game.id === item.game.id,
        )

        return updatedGame
          ? { ...item, game: updatedGame }
          : item
      }),
    )
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  return (
    <BrowserRouter>
      <div className="site-cosmos-backdrop" aria-hidden="true">
        <svg className="site-cosmos-map" viewBox="0 0 1440 3200" preserveAspectRatio="none">
          <path d="M-80 250C230 390 180 670 495 820s422 60 515 355 40 520 310 690 280 430 190 760" />
          <path d="M1270 120c-200 170-110 380-340 530S690 930 750 1150s270 300 120 520-250 300-120 540 350 250 320 620" />
          <path d="M105 1090c160-150 270-140 385-65m390 950c115-70 220-75 350-15" />
          <path d="M180 520l5-13 5 13 13 5-13 5-5 13-5-13-13-5 13-5Zm920 390 4-10 4 10 10 4-10 4-4 10-4-10-10-4 10-4Zm-590 1580 4-11 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" />
          <path d="M970 2100c60-38 112-44 165-24m-865 590c52-30 96-36 139-20" />
          <circle cx="496" cy="820" r="3" />
          <circle cx="1010" cy="1205" r="4" />
          <circle cx="870" cy="1670" r="3" />
          <circle cx="750" cy="2210" r="4" />
          <circle cx="1070" cy="2830" r="3" />
          <circle cx="315" cy="360" r="2" />
          <circle cx="1180" cy="690" r="2" />
          <circle cx="260" cy="1460" r="2" />
          <circle cx="1120" cy="1930" r="2" />
          <circle cx="390" cy="2500" r="2" />
          <g className="site-cosmos-ship" transform="translate(1040 780) scale(.78) rotate(-16)">
            <path className="site-cosmos-ship-hull" d="m3 27 25-7 17-11 28 5 34 13-34 13-28 5-17-11Z" />
            <path className="site-cosmos-ship-wing" d="m27 20-13-13 32 6m-19 21L14 47l32-6" />
            <path className="site-cosmos-ship-cockpit" d="m61 22 15 5-15 5-8-5Z" />
            <path className="site-cosmos-ship-trail" d="M3 24h-7m7 6h-7" />
            <path className="site-cosmos-ship-detail" d="m34 22 10 5-10 5m16-17 8 5m-8 20 8-5" />
          </g>
        </svg>
        <span className="site-cosmos-planet site-cosmos-planet-violet"><i /></span>
        <span className="site-cosmos-planet site-cosmos-planet-blue"><i /></span>
        <span className="site-cosmos-planet site-cosmos-planet-ringed"><i /></span>
        <span className="site-cosmos-planet site-cosmos-planet-distant"><i /></span>
        <span className="site-cosmos-asteroids" />
        <span className="site-cosmos-moonlet" />
      </div>
      <div className="site-shell">
      <ScrollToTop />
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <Header cartCount={cartCount} favoriteCount={favoriteIds.length} />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                games={games}
                isLoading={isLoading}
                error={error}
                onAddToCart={addToCart}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            }
          />

          <Route
            path="/favorites"
            element={
              <FavoritesPage
                games={games}
              isLoading={isLoading}
              error={error}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                isLoading={isLoading}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeFromCart}
              />
            }
          />

          <Route
            path="/checkout"
            element={
              <CheckoutPage
                cartItems={cartItems}
                onOrderPaid={() => setCartItems([])}
              />
            }
          />
          <Route path="/orders/my" element={<MyOrdersPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route
            path="/game/:id"
            element={
              <GamePage
                games={games}
                onAddToCart={addToCart}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
              />
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage
                  games={games}
                  isLoading={isLoading}
                  error={error}
                  setGames={handleGamesChange}
                  onGameDeleted={handleGameDeleted}
                />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
