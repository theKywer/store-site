
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

// Обрабатывает CORS, REST-запросы к играм и простые текстовые страницы API.
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  // Разрешает браузеру выполнить предварительную CORS-проверку запроса.
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Получение списка игр
  // Возвращает весь текущий список игр в формате JSON.
  if (req.method === 'GET' && req.url === '/games') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(JSON.stringify(games))
    return
  }

  // Добавление новой игры
  // Принимает JSON игры, проверяет поля и добавляет запись в память сервера.
  if (req.method === 'POST' && req.url === '/games') {
    let body = ''

    // Собирает тело запроса по мере поступления сетевых фрагментов.
    req.on('data', (chunk) => {
      body += chunk
    })

    // После получения всего тела разбирает JSON и проверяет данные игры.
    req.on('end', () => {
      try {
        const newGameData = JSON.parse(body)

        if (
          typeof newGameData.title !== 'string' ||
          !newGameData.title.trim() ||
          !Number.isFinite(Number(newGameData.price))
        ) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })

          res.end('Некорректные данные игры')
          return
        }

        const newGame = {
          id: games.length + 1,
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

        if (Object.keys(updatedData).length === 0) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Нет данных для обновления')
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
            updatedData.price === '')
        ) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Некорректная цена игры')
          return
        }

        if (
          Object.keys(updatedData).some(
            (key) => !['title', 'price'].includes(key)
          )
        ) {
          res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8',
          })
          res.end('Неизвестное поле игры')
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




  // Возвращает приветствие на корневой адрес API.
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
    })

    res.end('Добро пожаловать в Luna Market')
    return
  }

  // Возвращает короткое текстовое описание проекта.
  if (req.method === 'GET' && req.url === '/about') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
    })

    res.end('Luna Market — игровой магазин')
    return
  }



  // Удаляет игру по ID из URL и возвращает удалённую запись.
  if (req.method === 'DELETE' && req.url.startsWith('/games/')) {
  const gameId = Number(req.url.split('/')[2])

  if (!Number.isInteger(gameId) || gameId <= 0) {
    res.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    res.end('Некорректный ID игры')
    return
  }

  // Ищет индекс игры, чтобы удалить её из массива.
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

  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
  })

  res.end('Страница не найдена')
})

// Запускает API на локальном порту 3000.
server.listen(3000, () => {
  console.log('Сервер запущен: http://localhost:3000')
})
