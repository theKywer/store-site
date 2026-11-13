const http = require('http')

const server = http.createServer((req, res) => {
  // Разрешаем запросы с других источников
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  // Обрабатываем предварительный запрос браузера
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.writeHead(405)
    res.end('Метод не поддерживается')
    return
  }

  if (req.url === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
    })

    res.end('Добро пожаловать в Luna Market')
  } else if (req.url === '/games') {
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

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    res.end(JSON.stringify(games))
  } else if (req.url === '/about') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
    })

    res.end('Luna Market — игровой магазин')
  } else {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    })

    res.end('Страница не найдена')
  }
})

server.listen(3000, () => {
  console.log('Сервер запущен: http://localhost:3000')
})