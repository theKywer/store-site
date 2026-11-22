import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { filterHelpQuestions, helpCategories, helpScenarios } from '../data/supportCenter'
import './SupportPage.css'

function HelpIcon({ name, className = '' }) {
  const iconPaths = {
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.4 7.6 7.6 4.3 7.6-4.3M12 12v9M8 5.3l8 4.5" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 2 2-2 2 2 2-3 3-2-2-2 2" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    plane: <path d="m21 4-3.3 16-5.2-3.8-2.5 2.4.4-5.2L18 7.1 7 13.4l-5-1.6L21 4Z" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9.9-1.9 1.3-1.9 2.9M12 17h.01" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  }

  return (
    <svg className={`help-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

function HelpLinks({ links }) {
  if (!links?.length) return null

  return (
    <span className="help-answer-links">
      {links.map((link) => link.href ? (
        <a href={link.href} target="_blank" rel="noopener noreferrer" key={link.label}>
          {link.label}<span aria-hidden="true">↗</span>
        </a>
      ) : (
        <Link to={link.to} key={link.label}>
          {link.label}<span aria-hidden="true">→</span>
        </Link>
      ))}
    </span>
  )
}

function scrollToElement(element) {
  if (!element) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY)
  } else {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function answerCountLabel(count) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'ответов'
  if (lastDigit === 1) return 'ответ'
  if (lastDigit >= 2 && lastDigit <= 4) return 'ответа'
  return 'ответов'
}

function SupportPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeScenario, setActiveScenario] = useState(null)
  const faqRef = useRef(null)
  const assistantRef = useRef(null)

  const filteredQuestions = useMemo(() => {
    return filterHelpQuestions(query, activeCategory)
  }, [activeCategory, query])

  function chooseCategory(categoryId) {
    setActiveCategory(categoryId)
    scrollToElement(faqRef.current)
  }

  function resetAssistant({ scroll = false } = {}) {
    setActiveScenario(null)
    if (scroll) scrollToElement(assistantRef.current)
  }

  const selectedScenario = helpScenarios.find((scenario) => scenario.id === activeScenario)

  return (
    <div className="help-center">
      <section className="help-hero" aria-labelledby="help-title">
        <div className="help-hero-orbit help-hero-orbit-one" aria-hidden="true" />
        <div className="help-hero-orbit help-hero-orbit-two" aria-hidden="true" />
        <div className="help-hero-content">
          <span className="help-eyebrow"><i aria-hidden="true" /> ЦЕНТР ПОМОЩИ LUNA MARKET</span>
          <h1 id="help-title">Как мы можем<br /><em>помочь?</em></h1>
          <p>Ответы на вопросы, инструкции и помощь с покупками</p>
          <label className="help-search" htmlFor="help-search-input">
            <HelpIcon name="search" />
            <input
              id="help-search-input"
              type="search"
              aria-label="Поиск по вопросам и ответам"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например, где найти заказ?"
              autoComplete="off"
            />
            <span className="help-search-hint">Поиск по справке</span>
          </label>
        </div>
        <div className="help-hero-moon" aria-hidden="true"><span /></div>
        <div className="help-hero-footnote"><span>01</span> НАЙДИ ОТВЕТ · В СВОЁМ ТЕМПЕ</div>
      </section>

      <section className="help-section help-category-section" aria-labelledby="help-categories-title">
        <div className="help-section-heading">
          <div>
            <span className="help-eyebrow">ВЫБЕРИ НАПРАВЛЕНИЕ</span>
            <h2 id="help-categories-title">Темы помощи</h2>
          </div>
          <button
            type="button"
            className={`help-reset-filter${activeCategory === 'all' ? ' is-active' : ''}`}
            onClick={() => chooseCategory('all')}
            aria-pressed={activeCategory === 'all'}
          >
            Все темы <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="help-category-grid">
          {helpCategories.map((category, index) => (
            <button
              type="button"
              className={`help-category-card${activeCategory === category.id ? ' is-active' : ''}`}
              key={category.id}
              onClick={() => chooseCategory(category.id)}
              aria-pressed={activeCategory === category.id}
              style={{ '--help-card-index': index }}
            >
              <span className="help-category-card-top">
                <span className={`help-category-icon help-category-icon-${category.icon}`}>
                  <HelpIcon name={category.icon} />
                </span>
                <span className="help-category-arrow" aria-hidden="true">↗</span>
              </span>
              <strong>{category.title}</strong>
              <span className="help-category-description">{category.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="help-section help-faq-section" aria-labelledby="help-faq-title" ref={faqRef}>
        <div className="help-section-heading help-faq-heading">
          <div>
            <span className="help-eyebrow">БЫСТРЫЕ ОТВЕТЫ</span>
            <h2 id="help-faq-title">
              {activeCategory === 'all'
                ? 'Частые вопросы'
                : helpCategories.find((category) => category.id === activeCategory)?.title}
            </h2>
          </div>
          <span className="help-result-count" aria-live="polite">
            {filteredQuestions.length} {answerCountLabel(filteredQuestions.length)}
          </span>
        </div>

        {filteredQuestions.length ? (
          <div className="help-faq-list">
            {filteredQuestions.map((item, index) => (
              <details className="help-faq-item" key={item.id}>
                <summary>
                  <span className="help-faq-number">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item.question}</span>
                  <span className="help-faq-toggle" aria-hidden="true" />
                </summary>
                <div className="help-faq-answer">
                  <p>{item.answer}</p>
                  <HelpLinks links={item.links} />
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="help-empty-results" role="status">
            <span aria-hidden="true">✧</span>
            <strong>Не нашли совпадений</strong>
            <p>Попробуй другой запрос или посмотри все темы справки.</p>
            <button type="button" onClick={() => { setQuery(''); setActiveCategory('all') }}>
              Показать все ответы
            </button>
          </div>
        )}
      </section>

      <section className="help-section help-assistant-section" aria-labelledby="help-assistant-title" ref={assistantRef}>
        <div className="help-assistant-panel">
          <div className="help-assistant-heading">
            <span className="help-assistant-orb" aria-hidden="true"><HelpIcon name="help" /></span>
            <span className="help-eyebrow">ПОШАГОВАЯ САМОПРОВЕРКА</span>
            <h2 id="help-assistant-title">Помощь с проблемой</h2>
            <p>Выбери ситуацию — подскажем, что проверить в Luna Market.</p>
          </div>

          {selectedScenario ? (
            <div className="help-scenario-result" aria-live="polite">
              <div className="help-scenario-title-row">
                <span className={`help-scenario-icon help-category-icon-${selectedScenario.icon}`}>
                  <HelpIcon name={selectedScenario.icon} />
                </span>
                <h3>{selectedScenario.title}</h3>
              </div>
              <ol className="help-scenario-steps">
                {selectedScenario.steps.map((step, index) => (
                  <li key={`${selectedScenario.id}-${index}`}>
                    <span className="help-step-number">{index + 1}</span>
                    <div><p>{step.text}<HelpLinks links={step.links} /></p></div>
                  </li>
                ))}
              </ol>
              <p className="help-scenario-note"><HelpIcon name="help" />{selectedScenario.note}</p>
              <div className="help-scenario-controls">
                <button type="button" className="help-secondary-button" onClick={() => resetAssistant()}>
                  <span aria-hidden="true">←</span> Назад
                </button>
                <button type="button" className="help-home-button" onClick={() => resetAssistant({ scroll: true })}>
                  В начало <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="help-scenario-grid">
              {helpScenarios.map((scenario) => (
                <button type="button" className="help-scenario-choice" key={scenario.id} onClick={() => setActiveScenario(scenario.id)}>
                  <span className={`help-scenario-icon help-category-icon-${scenario.icon}`}><HelpIcon name={scenario.icon} /></span>
                  <span>{scenario.title}</span>
                  <span className="help-category-arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          )}

          <p className="help-no-operator">Это автоматические инструкции. В проекте нет онлайн-чата и операторской поддержки.</p>
        </div>
      </section>

      <section className="help-footer-note" aria-label="Информация о проекте">
        <span className="help-footer-moon" aria-hidden="true">☾</span>
        <p>Luna Market — учебный проект. Реальные покупки, платежи и игровые лицензии недоступны.</p>
        <Link to="/">На главную <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  )
}

export default SupportPage
