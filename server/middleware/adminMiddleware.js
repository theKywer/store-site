const prisma = require('../prisma')

async function adminMiddleware(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Недостаточно прав для выполнения операции',
      })
    }

    req.user.role = user.role
    next()
  } catch (error) {
    console.error('Ошибка проверки прав администратора:', error)
    return res.status(500).json({
      message: 'Не удалось проверить права доступа',
    })
  }
}

module.exports = adminMiddleware
