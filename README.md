# 🌙 Luna Market

**Luna Market** — учебный full-stack интернет-магазин цифровых видеоигр. Проект объединяет React-приложение, Express API, PostgreSQL и Telegram-бота для работы с каталогом, заказами и уведомлениями.

**[🌐 Открыть магазин](https://luna-market.onrender.com/)** · **[🤖 Telegram-бот](https://t.me/LunaMarketGameBot)** · **[📦 Репозиторий бота](https://github.com/theKywer/luna-market-bot)**

> **Демонстрационный проект.** Оплата не списывает реальные деньги, а выдаваемые ключи предназначены только для демонстрации работы магазина и не активируют игры.

## ✨ Возможности

### 🎮 Каталог и интерфейс

- Просмотр каталога и подробных страниц игр.
- Поиск по названию, жанру и описанию; фильтрация и сортировка.
- Галереи изображений, видео и трейлеров.
- Избранное и корзина с сохранением данных в браузере.
- Адаптивный интерфейс, уведомления и состояния загрузки/ошибок.
- Информационные и правовые страницы, интерактивный раздел поддержки.

### 🛍 Аккаунты и заказы

- Регистрация, вход, подтверждение электронной почты.
- JWT-аутентификация, хеширование паролей с помощью bcrypt, роли `USER` и `ADMIN`.
- Профиль пользователя и история заказов.
- Оформление заказов, демонстрационная оплата, изменение статусов и выдача демонстрационных ключей.
- Отзывы и оценки игр.

### ⚙️ Администрирование

- Добавление, редактирование и удаление игр.
- Управление галереями и сведениями о товарах.
- Просмотр заказов и управление их статусами.

### 🤖 Telegram-интеграция

- Привязка Telegram к аккаунту магазина через одноразовую ссылку.
- Просмотр заказов в **[@LunaMarketGameBot](https://t.me/LunaMarketGameBot)**.
- Уведомления о событиях заказа с возможностью отключения в профиле.
- Доступ к каталогу, поиску и автоматизированной справке через отдельного бота.

Исходный код Python-бота хранится отдельно: **[theKywer/luna-market-bot](https://github.com/theKywer/luna-market-bot)**.

## 🛠 Технологии

| Часть системы | Стек |
| --- | --- |
| Frontend | React, JavaScript, Vite, React Router, CSS |
| Backend | Node.js, Express, REST API |
| База данных | PostgreSQL, Prisma ORM |
| Авторизация | JWT, bcrypt |
| Email | EmailJS (подтверждение почты) |
| Инструменты разработки | Git, GitHub, Docker, Docker Compose |
| Telegram | Python, aiogram, HTTP API (отдельный репозиторий) |

## ☁️ Архитектура и развёртывание

```text
Пользователь ──► React / Vite (Render Static Site)
                       │ HTTPS REST API
                       ▼
                 Express (Render Web Service) ───► PostgreSQL (Neon)
                       ▲               │
                       │ Telegram API  └──► Telegram Bot API (уведомления)
                       │
                Python / aiogram (Railway)
                       ▲
                       │
                  Telegram
```

| Компонент | Сервис | Адрес |
| --- | --- | --- |
| Магазин | Render Static Site | [luna-market.onrender.com](https://luna-market.onrender.com/) |
| API | Render Web Service | [luna-market-express-api.onrender.com](https://luna-market-express-api.onrender.com/) |
| PostgreSQL | Neon | Доступ по защищённой строке подключения |
| Telegram-бот | Railway | [@LunaMarketGameBot](https://t.me/LunaMarketGameBot) |

На бесплатном тарифе Render сервер может переходить в спящий режим после простоя: первый запрос после паузы иногда выполняется дольше обычного.

## 📁 Структура проекта

```text
store-site/
├── public/                 # Статические ресурсы
├── src/
│   ├── components/         # Общие UI-компоненты
│   ├── pages/              # Страницы приложения
│   ├── api.js              # Базовый адрес и запросы API
│   └── App.jsx             # Маршруты и приложение
├── server/
│   ├── middleware/         # Авторизация и права доступа
│   ├── routes/             # В том числе Telegram API
│   ├── prisma/             # Модели и миграции
│   ├── express-server.js   # Точка входа Express
│   └── package.json
├── docker-compose.yml      # Локальная PostgreSQL
├── vite.config.js
├── package.json
└── README.md
```

## 🔌 Примеры API-маршрутов

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/games` | Список игр |
| `GET` | `/games/:id` | Данные игры |
| `POST` | `/auth/register` | Регистрация |
| `POST` | `/auth/login` | Вход |
| `GET` | `/orders/my` | Заказы авторизованного пользователя |
| `POST` | `/orders` | Оформление заказа |
| `GET` | `/telegram/status` | Статус привязки Telegram (JWT) |
| `POST` | `/telegram/link-token` | Одноразовая ссылка привязки (JWT) |
| `PATCH` | `/telegram/notifications` | Настройка уведомлений (JWT) |
| `POST` | `/telegram/orders` | Заказы для авторизованного Telegram-бота |

Часть маршрутов требует JWT или специального секрета интеграции. Полный список и условия доступа определены в коде Express.


## 📌 Статус

Основные функции магазина и облачная интеграция с Telegram реализованы. Проект создан в образовательных целях и продолжает развиваться.

## 👨‍💻 Автор

[theKywer](https://github.com/theKywer)

---

Luna Market © 2026