
const http = require('http')

const games = [
  {
    id: 1,
    title: 'Cyberpunk 2077',
    price: 17999,
  },
  {
    id: 2,
    title: 'The Witcher 3',
    price: 15999,
  },
]

// Создание HTTP-сервера
const server = http.createServer((req, res) => {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  // Обработка предварительного CORS-запроса
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Получение списка игр
  if (req.method === 'GET' && req.url === '/games') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(JSON.stringify(games))
    return
  }

  // Добавление новой игры
  if (req.method === 'POST' && req.url === '/games') {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        const newGameData = JSON.parse(body)

        if (
          typeof newGameData.title !== 'string' ||
          !newGameData.title.trim() ||
          !Number.isFinite(Number(newGameData.price)) ||
          newGameData.price === '' ||
          Number(newGameData.price) < 0
        ) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Некорректные данные игры')
          return
        }

        const newGame = {
          id: games.length > 0
            ? Math.max(...games.map((game) => game.id)) + 1
            : 1,
          title: newGameData.title.trim(),
          price: Number(newGameData.price),
        }

        games.push(newGame)

        res.writeHead(201, {
          'Content-Type': 'application/json; charset=utf-8',
        })

        res.end(JSON.stringify(newGame))
      } catch {
        res.writeHead(400, {
          'Content-Type': 'text/plain; charset=utf-8',
        })
        res.end('Некорректный JSON')
      }
    })

    return
  }

  // Редактирование игры
  if (req.method === 'PATCH' && req.url.startsWith('/games/')) {
    const gameId = Number(req.url.split('/')[2])

    if (!Number.isInteger(gameId) || gameId <= 0) {
      res.writeHead(400, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
      res.end('Некорректный ID игры')
      return
    }

    const game = games.find((game) => game.id === gameId)

    if (!game) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
      res.end('Игра не найдена')
      return
    }

    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        const updatedData = JSON.parse(body)

        if (
          !updatedData ||
          typeof updatedData !== 'object' ||
          Array.isArray(updatedData) ||
          Object.keys(updatedData).length === 0
        ) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Нет данных для обновления')
          return
        }

        const allowedFields = ['title', 'price']
        const hasUnknownFields = Object.keys(updatedData).some(
          (key) => !allowedFields.includes(key)
        )

        if (hasUnknownFields) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Неизвестное поле игры')
          return
        }

        if (
          updatedData.title !== undefined &&
          (typeof updatedData.title !== 'string' ||
            !updatedData.title.trim())
        ) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Некорректное название игры')
          return
        }

        if (
          updatedData.price !== undefined &&
          (!Number.isFinite(Number(updatedData.price)) ||
            updatedData.price === '' ||
            Number(updatedData.price) < 0)
        ) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Некорректная цена игры')
          return
        }

        if (updatedData.title !== undefined) {
          game.title = updatedData.title.trim()
        }

        if (updatedData.price !== undefined) {
          game.price = Number(updatedData.price)
        }

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
        })

        res.end(JSON.stringify(game))
      } catch {
        res.writeHead(400, {
          'Content-Type': 'text/plain; charset=utf-8',
        })
        res.end('Некорректный JSON')
      }
    })

    return
  }

  // Удаление игры
  if (req.method === 'DELETE' && req.url.startsWith('/games/')) {
    const gameId = Number(req.url.split('/')[2])

    if (!Number.isInteger(gameId) || gameId <= 0) {
      res.writeHead(400, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
      res.end('Некорректный ID игры')
      return
    }

    const gameIndex = games.findIndex((game) => game.id === gameId)

    if (gameIndex === -1) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
      res.end('Игра не найдена')
      return
    }

    const deletedGame = games.splice(gameIndex, 1)[0]

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(JSON.stringify({
      message: 'Игра успешно удалена',
      game: deletedGame,
    }))

    return
  }

  // Главная страница API
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
    })

    res.end('Добро пожаловать в Luna Market')
    return
  }

  // Информация о проекте
  if (req.method === 'GET' && req.url === '/about') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
    })

    res.end('Luna Market — игровой магазин')
    return
  }

  // Неизвестный маршрут
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
  })

  res.end('Страница не найдена')
})

// Запуск сервера
server.listen(3000, () => {
  console.log('Сервер запущен: http://localhost:3000')
})
