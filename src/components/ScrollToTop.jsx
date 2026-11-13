
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** При смене маршрута прокручивает страницу вверх или к якорю URL. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      target?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }, [pathname, hash])

  return null
}

export default ScrollToTop
