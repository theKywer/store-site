
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
import ToastViewport from './components/ToastViewport'

import games from './data/game'
import './App.css'

function App() {
  const [toasts, setToasts] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const savedFavorites = JSON.parse(
        localStorage.getItem('favoriteGameIds') || '[]',
      )
      return Array.isArray(savedFavorites)
        ? [...new Set(savedFavorites.map(Number))].filter((id) =>
            games.some((game) => game.id === id),
          )
        : []
    } catch {
      return []
    }
  })

  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cartItems')

      if (!savedCart) return []

      const parsedCart = JSON.parse(savedCart)

      if (!Array.isArray(parsedCart)) return []

      return parsedCart.reduce((cart, item) => {
        if (!item || typeof item !== 'object') return cart

        const savedGame = item.game ?? item
        const gameId = Number(savedGame?.id)
        const game = games.find((entry) => entry.id === gameId)

        if (!game) return cart

        const savedQuantity = item.game ? Number(item.quantity) : 1
        const quantity = Number.isFinite(savedQuantity) && savedQuantity > 0
          ? Math.max(1, Math.floor(savedQuantity))
          : 1

        const existingItem = cart.find(
          (cartItem) => cartItem.game.id === game.id
        )

        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          cart.push({ game, quantity })
        }

        return cart
      }, [])
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems))
    } catch {
      // The cart remains usable for this session if storage is unavailable.
    }
  }, [cartItems])

  useEffect(() => {
    try {
      localStorage.setItem('favoriteGameIds', JSON.stringify(favoriteIds))
    } catch {
      // Favorites remain usable for this session if storage is unavailable.
    }
  }, [favoriteIds])

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

  function toggleFavorite(gameId) {
    const willBeFavorite = !favoriteIds.includes(gameId)
    const gameTitle = games.find((game) => game.id === gameId)?.title
    setFavoriteIds((currentIds) =>
      currentIds.includes(gameId)
        ? currentIds.filter((id) => id !== gameId)
        : [...currentIds, gameId]
    )
    notify(
      willBeFavorite
        ? `«${gameTitle}» добавлена в избранное`
        : `«${gameTitle}» удалена из избранного`,
      'favorite',
    )
  }

  function addToCart(game) {
    const isAlreadyInCart = cartItems.some((item) => item.game.id === game.id)
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.game.id === game.id
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.game.id === game.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
          : item
      )
    )
  }

  function decreaseQuantity(gameId) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.game.id === gameId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(gameId) {
    const removedGame = cartItems.find((item) => item.game.id === gameId)?.game
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.game.id !== gameId)
    )
    if (removedGame) notify(`«${removedGame.title}» удалена из корзины`, 'cart')
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  )
}

export default App
