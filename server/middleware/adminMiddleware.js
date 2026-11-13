function adminMiddleware(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Недостаточно прав для выполнения операции',
    })
  }

  next()
}

module.exports = adminMiddleware