
const express = require('express')
const prisma = require('./prisma')

const app = express()

app.use(express.json())

// Главная страница
app.get('/', (req, res) => {
  res.send('Добро пожаловать в Luna Market')
})

// Информация о магазине
app.get('/about', (req, res) => {
  res.send('Luna Market — игровой магазин')
})

// Контакты
app.get('/contact', (req, res) => {
  res.send('Связаться с Luna Market можно через поддержку')
})

// Получение всех игр
app.get('/games', async (req, res) => {
  try {
    const games = await prisma.game.findMany()

    res.json(games)
  } catch (error) {
    console.error('Ошибка получения игр:', error)

    res.status(500).json({
      message: 'Не удалось получить игры',
    })
  }
})

// Получение одной игры
app.get('/games/:id', async (req, res) => {
  try {
    const gameId = Number(req.params.id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return res.status(400).json({
        message: 'Некорректный ID игры',
      })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        gallery: true,
      },
    })

    if (!game) {
      return res.status(404).json({
        message: 'Игра не найдена',
      })
    }

    res.json(game)
  } catch (error) {
    console.error('Ошибка получения игры:', error)

    res.status(500).json({
      message: 'Не удалось получить игру',
    })
  }
})

// Добавление игры
app.post('/games', async (req, res) => {
  try {
    const { title, price } = req.body

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        message: 'Некорректное название игры',
      })
    }

    if (
      price === undefined ||
      price === null ||
      price === '' ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: 'Некорректная цена игры',
      })
    }

    const newGame = await prisma.game.create({
      data: {
        title: title.trim(),
        price: Number(price),
        genre: 'Не указан',
        description: 'Описание пока отсутствует',
        image: '',
        officialTrailerId: '',
        developer: 'Не указан',
        publisher: 'Не указан',
        releaseDate: 'Не указана',
        ageRating: 'Не указан',
        platform: 'Не указана',
      },
    })

    res.status(201).json(newGame)
  } catch (error) {
    console.error('Ошибка создания игры:', error)

    res.status(500).json({
      message: 'Не удалось создать игру',
    })
  }
})

// Редактирование игры
app.patch('/games/:id', async (req, res) => {
  try {
    const gameId = Number(req.params.id)
    const { title, price } = req.body

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return res.status(400).json({
        message: 'Некорректный ID игры',
      })
    }

    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!existingGame) {
      return res.status(404).json({
        message: 'Игра не найдена',
      })
    }

    if (title === undefined && price === undefined) {
      return res.status(400).json({
        message: 'Нет данных для обновления',
      })
    }

    if (
      title !== undefined &&
      (typeof title !== 'string' || !title.trim())
    ) {
      return res.status(400).json({
        message: 'Некорректное название игры',
      })
    }

    if (
      price !== undefined &&
      (
        price === null ||
        price === '' ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
      )
    ) {
      return res.status(400).json({
        message: 'Некорректная цена игры',
      })
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(price !== undefined && { price: Number(price) }),
      },
    })

    res.json(updatedGame)
  } catch (error) {
    console.error('Ошибка обновления игры:', error)

    res.status(500).json({
      message: 'Не удалось обновить игру',
    })
  }
})

// Удаление игры
app.delete('/games/:id', async (req, res) => {
  try {
    const gameId = Number(req.params.id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return res.status(400).json({
        message: 'Некорректный ID игры',
      })
    }

    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!existingGame) {
      return res.status(404).json({
        message: 'Игра не найдена',
      })
    }

    const deletedGame = await prisma.game.delete({
      where: { id: gameId },
    })

    res.json({
      message: 'Игра успешно удалена',
      game: deletedGame,
    })
  } catch (error) {
    console.error('Ошибка удаления игры:', error)

    res.status(500).json({
      message: 'Не удалось удалить игру',
    })
  }
})

// Запуск сервера
app.listen(3001, () => {
  console.log('Express запущен: http://localhost:3001')
})
