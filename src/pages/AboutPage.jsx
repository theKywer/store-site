import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './AboutPage.css'

const features = [
  {
    icon: 'catalog',
    eyebrow: 'ИССЛЕДУЙ',
    title: 'Каталог игр',
    description: 'Ищи по названию, жанру или описанию, фильтруй по возрасту и сортируй по цене или названию.',
    href: '/#catalog',
    action: 'Открыть каталог',
  },
  {
    icon: 'favorite',
    eyebrow: 'СОХРАНЯЙ',
    title: 'Избранное',
    description: 'Собирай интересные игры в личный список. Избранное сохраняется в браузере.',
    href: '/favorites',
    action: 'К избранному',
  },
  {
    icon: 'order',
    eyebrow: 'ПРОБУЙ',
    title: 'Покупки и заказы',
    description: 'Пройди демонстрационный сценарий заказа и посмотри его историю. Реальные деньги не списываются.',
    href: '/orders/my',
    action: 'История заказов',
  },
  {
    icon: 'account',
    eyebrow: 'НАСТРАИВАЙ',
    title: 'Личный кабинет',
    description: 'Управляй данными профиля, аватаром и настройками уведомлений о заказах в Telegram.',
    href: '/profile',
    action: 'Открыть профиль',
  },
  {
    icon: 'telegram',
    eyebrow: 'ОСТАВАЙСЯ НА СВЯЗИ',
    title: 'Telegram-бот',
    description: 'Привяжи аккаунт, смотри историю заказов командой /orders и получай уведомления.',
    href: 'https://t.me/LunaMarketGameBot',
    action: 'Открыть бота',
    external: true,
  },
]

const milestones = [
  {
    date: '13 ноября 2026',
    title: 'Основа проекта',
    description: 'Начальная схема данных и модель пользователя — первые зафиксированные миграции репозитория.',
    tag: 'ИНИЦИАЛИЗАЦИЯ · ПОЛЬЗОВАТЕЛИ',
  },
  {
    date: '14 ноября 2026',
    title: 'Корзина и заказы',
    description: 'В схеме появились заказы, их позиции и демонстрационные ключи для сценария оплаты.',
    tag: 'ЗАКАЗЫ · ДЕМО-ОПЛАТА',
  },
  {
    date: '15–17 ноября 2026',
    title: 'Профиль и отзывы',
    description: 'Добавлены данные профиля, подтверждение почты и отзывы на игры.',
    tag: 'АККАУНТ · ОТЗЫВЫ',
  },
  {
    date: '20 ноября 2026',
    title: 'Связь с Telegram',
    description: 'В репозитории зафиксирована привязка Telegram-аккаунта к профилю Luna Market.',
    tag: 'TELEGRAM · ПРИВЯЗКА',
  },
  {
    date: '22 ноября 2026',
    title: 'Настройки уведомлений',
    description: 'Добавлено управление уведомлениями о заказах. Для новой настройки подготовлена отдельная миграция.',
    tag: 'TELEGRAM · НАСТРОЙКИ',
  },
]

const stack = [
  {
    id: 'web',
    label: 'ИНТЕРФЕЙС',
    title: 'React + Vite',
    detail: 'Страницы магазина',
    mark: 'R',
  },
  {
    id: 'api',
    label: 'СЕРВЕР И API',
    title: 'Node.js + Express',
    detail: 'Маршруты и логика',
    mark: 'N',
  },
  {
    id: 'data',
    label: 'ХРАНИЛИЩЕ',
    title: 'PostgreSQL + Prisma',
    detail: 'Данные и ORM',
    mark: 'P',
  },
]

function FeatureIcon({ type }) {
  const paths = {
    catalog: <><path d="M4 5.5h16v13H4z" /><path d="M8 9h8M8 12h5M8 15h7" /></>,
    favorite: <path d="M20.4 8.7c0 4.1-8.4 9.7-8.4 9.7S3.6 12.8 3.6 8.7a4.2 4.2 0 0 1 7.5-2.6l.9 1.1.9-1.1a4.2 4.2 0 0 1 7.5 2.6Z" />,
    order: <><path d="M5 7h14l-1.2 12H6.2L5 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3M9 13h.01M15 13h.01" /></>,
    account: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    telegram: <path d="m21 4-3.3 16-5.2-3.8-2.5 2.4.4-5.2L18 7.1 7 13.4l-5-1.6L21 4Z" />,
  }

  return (
    <svg className={`about-feature-icon about-feature-icon-${type}`} viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

function scrollToFeatures(event) {
  event.preventDefault()
  const target = document.getElementById('about-capabilities')
  if (!target) return

  const top = target.getBoundingClientRect().top + window.scrollY
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    window.scrollTo(0, top)
  } else {
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function AboutPage() {
  useEffect(() => {
    const elements = document.querySelectorAll('.about-page [data-about-reveal]')

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' })

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-stars" aria-hidden="true" />
        <div className="about-hero-copy" data-about-reveal>
          <span className="about-eyebrow"><span /> ВНУТРИ LUNA MARKET</span>
          <h1 id="about-title">Больше, чем<br /><em>просто игры.</em></h1>
          <p>
            Luna Market — учебный проект игрового магазина: каталог для поиска новых миров,
            личный кабинет и демонстрационный сценарий заказов.
          </p>
          <a className="about-scroll-link" href="#about-capabilities" onClick={scrollToFeatures}>
            <span className="about-scroll-icon" aria-hidden="true">↓</span>
            Исследовать проект
          </a>
        </div>

        <div className="about-moon-scene" aria-hidden="true">
          <div className="about-orbit about-orbit-one" />
          <div className="about-orbit about-orbit-two" />
          <div className="about-moon">
            <span className="about-crater about-crater-one" />
            <span className="about-crater about-crater-two" />
            <span className="about-crater about-crater-three" />
          </div>
          <span className="about-star about-star-one">✦</span>
          <span className="about-star about-star-two">·</span>
          <span className="about-star about-star-three">✧</span>
          <span className="about-moon-caption">СВОЯ ОРБИТА · СВОИ ИСТОРИИ</span>
        </div>

        <a className="about-hero-scroll" href="#about-capabilities" onClick={scrollToFeatures} aria-label="Прокрутить к возможностям Luna Market">
          <span />
        </a>
      </section>

      <section className="about-section about-capabilities" id="about-capabilities" aria-labelledby="about-capabilities-title">
        <div className="about-section-heading" data-about-reveal>
          <span className="about-eyebrow">ОДИН МАГАЗИН — НЕСКОЛЬКО МАРШРУТОВ</span>
          <h2 id="about-capabilities-title">Что можно найти <em>внутри</em></h2>
          <p>Функции, которые уже есть в проекте — без обещаний за пределами текущей версии.</p>
        </div>

        <div className="about-feature-grid">
          {features.map((feature, index) => {
            const content = (
              <>
                <span className="about-feature-topline">
                  <FeatureIcon type={feature.icon} />
                  <span className="about-feature-index">0{index + 1}</span>
                </span>
                <span className="about-feature-eyebrow">{feature.eyebrow}</span>
                <strong className="about-feature-title">{feature.title}</strong>
                <span className="about-feature-description">{feature.description}</span>
                <span className="about-feature-action">{feature.action}<span aria-hidden="true">↗</span></span>
              </>
            )

            return feature.external ? (
              <a
                className="about-feature-card"
                data-about-reveal
                key={feature.title}
                href={feature.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${feature.action}, открывается в новой вкладке`}
                style={{ '--about-card-order': `${index * 55}ms` }}
              >
                {content}
              </a>
            ) : (
              <Link
                className="about-feature-card"
                data-about-reveal
                key={feature.title}
                to={feature.href}
                style={{ '--about-card-order': `${index * 55}ms` }}
              >
                {content}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="about-section about-history" aria-labelledby="about-history-title">
        <div className="about-section-heading" data-about-reveal>
          <span className="about-eyebrow">СЛОИ, ИЗ КОТОРЫХ РАСТЁТ ПРОЕКТ</span>
          <h2 id="about-history-title">История <em>развития</em></h2>
          <p>Этапы сверены с миграциями в репозитории. Эти даты отражают историю изменений проекта.</p>
        </div>

        <ol className="about-timeline">
          {milestones.map((milestone, index) => (
            <li className="about-timeline-item" data-about-reveal key={milestone.date} style={{ '--about-card-order': `${index * 55}ms` }}>
              <span className="about-timeline-marker" aria-hidden="true" />
              <article className="about-timeline-card">
                <time className="about-timeline-date">{milestone.date}</time>
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
                <span className="about-timeline-tag">{milestone.tag}</span>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-section about-technology" aria-labelledby="about-technology-title">
        <div className="about-section-heading" data-about-reveal>
          <span className="about-eyebrow">ТЕХНОЛОГИИ ПОД КАПОТОМ</span>
          <h2 id="about-technology-title">Несколько слоёв.<br /><em>Один связный опыт.</em></h2>
          <p>Интерфейс, API и хранилище работают вместе; Telegram-бот подключён к сайту через API.</p>
        </div>

        <div className="about-architecture" data-about-reveal>
          <div className="about-stack-flow" role="img" aria-label="Архитектура сайта: React и Vite, API на Node.js и Express, PostgreSQL с Prisma">
            {stack.map((item, index) => (
              <div className={`about-stack-card about-stack-${item.id}`} key={item.id}>
                <span className="about-stack-mark" aria-hidden="true">{item.mark}</span>
                <span className="about-stack-label">{item.label}</span>
                <strong>{item.title}</strong>
                <span className="about-stack-detail">{item.detail}</span>
                {index < stack.length - 1 && <span className="about-stack-connector" aria-hidden="true">→</span>}
              </div>
            ))}
          </div>

          <div className="about-bot-bridge">
            <span className="about-bridge-line" aria-hidden="true" />
            <span className="about-bridge-label">ИНТЕГРАЦИЯ ЧЕРЕЗ API</span>
            <div className="about-bot-card">
              <span className="about-bot-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m21 4-3.3 16-5.2-3.8-2.5 2.4.4-5.2L18 7.1 7 13.4l-5-1.6L21 4Z" /></svg>
              </span>
              <span><span className="about-stack-label">TELEGRAM-БОТ</span><strong>Python + aiogram</strong></span>
              <span className="about-bot-status"><i /> связан с API сайта</span>
            </div>
          </div>

          <p className="about-architecture-note">Telegram-интеграция использует API сайта для привязки аккаунта и работы с заказами.</p>
        </div>
      </section>

      <section className="about-cta" aria-labelledby="about-cta-title" data-about-reveal>
        <div className="about-cta-moon" aria-hidden="true" />
        <span className="about-eyebrow">ТВОЙ СЛЕДУЮЩИЙ ШАГ</span>
        <h2 id="about-cta-title">Твоя следующая история<br /><em>начинается здесь.</em></h2>
        <p>Загляни в каталог или продолжи путь вместе с Telegram-ботом Luna Market.</p>
        <div className="about-cta-actions">
          <Link className="about-button about-button-primary" to="/#catalog">Перейти в каталог <span aria-hidden="true">→</span></Link>
          <a className="about-button about-button-secondary" href="https://t.me/LunaMarketGameBot" target="_blank" rel="noopener noreferrer">Открыть Telegram <span aria-hidden="true">↗</span></a>
        </div>
        <span className="about-cta-disclaimer">Демонстрационный проект · реальные покупки недоступны</span>
      </section>
    </div>
  )
}

export default AboutPage
