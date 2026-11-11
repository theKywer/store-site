
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

import games from './data/game'
import './App.css'

function App() {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cartItems')

      if (!savedCart) return []

      const parsedCart = JSON.parse(savedCart)

      if (!Array.isArray(parsedCart)) return []

      return parsedCart.reduce((cart, item) => {
        const game = item.game ?? item
        const quantity = item.game
          ? Math.max(1, Number(item.quantity) || 1)
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
    localStorage.setItem('cartItems', JSON.stringify(cartItems))
  }, [cartItems])

  function addToCart(game) {
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
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.game.id !== gameId)
    )
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return (
    <BrowserRouter>
      <ScrollToTop />

      <Header cartCount={cartCount} />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                games={games}
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
              />
            }
          />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  )
}

export default App
