const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      message: 'Требуется авторизация',
    })
  }

  const bearerMatch = typeof authHeader === 'string'
    ? authHeader.match(/^Bearer\s+(\S+)$/i)
    : null

  if (!bearerMatch) {
    return res.status(401).json({
      message: 'Токен не предоставлен',
    })
  }

  const token = bearerMatch[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Недействительный или просроченный токен',
    })
  }
}

module.exports = authMiddleware
