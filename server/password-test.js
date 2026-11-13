const bcrypt = require('bcrypt')

async function main() {
  const password = '123456'

  // Создаём хеш пароля
  const hashedPassword = await bcrypt.hash(password, 10)

  console.log('Оригинальный пароль:', password)
  console.log('Хеш пароля:', hashedPassword)

  // Проверяем пароль
  const isPasswordCorrect = await bcrypt.compare(
    password,
    hashedPassword,
  )

  console.log('Пароль правильный:', isPasswordCorrect)
}

main()