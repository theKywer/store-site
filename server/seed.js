
const prisma = require('./prisma')

async function main() {
  // Загружаем существующий каталог из React-проекта
  const { default: games } = await import('../src/data/game.js')

  console.log(`Найдено игр: ${games.length}`)

  for (const game of games) {
    const { gallery = [], ...gameData } = game

    // Подготавливаем изображения и видео галереи
    const galleryData = gallery.map((media, index) => ({
      ...media,
      sortOrder: index,
    }))

    // Добавляем игру или обновляем существующую
    await prisma.game.upsert({
      where: {
        id: game.id,
      },

      create: {
        ...gameData,
        gallery: {
          create: galleryData,
        },
      },

      update: {
        ...gameData,
        gallery: {
          deleteMany: {},
          create: galleryData,
        },
      },
    })

    console.log(`Обработана игра: ${game.title}`)
  }

  // Синхронизируем счётчик ID PostgreSQL
  await prisma.$queryRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Game"', 'id'),
      (SELECT MAX(id) FROM "Game"),
      true
    )
  `)

  console.log('Каталог Luna Market успешно загружен!')
}

main()
  .catch((error) => {
    console.error('Ошибка загрузки каталога:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
