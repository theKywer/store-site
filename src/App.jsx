
import './App.css'

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
        const response = await fetch('/api/games')

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
    setGames(updateGames)

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        const updatedGame = updateGames.find(
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
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeFromCart}
              />
            }
          />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/legal" element={<LegalPage />} />

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
              <AdminPage
                games={games}
                isLoading={isLoading}
                error={error}
                setGames={handleGamesChange}
                onGameDeleted={handleGameDeleted}
              />
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  )
}

export default App
