
function SupportPage() {
  return (
    <section className="info-page">
      <span className="section-label">МЫ ГОТОВЫ ПОМОЧЬ</span>
      <h1>Поддержка</h1>

      <div className="info-page-content">
        <h2>Чем мы можем помочь?</h2>

        <p>
          Если у тебя возникли вопросы по работе сайта,
          предложения или пожелания, в будущем здесь
          можно будет связаться с командой Luna Market.
        </p>

        <div className="support-card">
          <h3>Техническая поддержка</h3>
          <p>
            По вопросам ошибок, отображения каталога
            и работы интерфейса.
          </p>
          <span>Система обращений пока находится в разработке.</span>
        </div>

        <div className="support-card">
          <h3>Частые вопросы</h3>

          <details>
            <summary>Можно ли купить игру на сайте?</summary>
            <p>
              Пока нет. Сейчас Luna Market — учебный
              проект, поэтому реальные покупки недоступны.
            </p>
          </details>

          <details>
            <summary>Сохраняется ли корзина?</summary>
            <p>
              Да. Добавленные игры сохраняются в браузере
              с помощью localStorage.
            </p>
          </details>

          <details>
            <summary>Можно ли предложить новую игру?</summary>
            <p>
              В будущем мы добавим возможность отправлять
              предложения по расширению каталога.
            </p>
          </details>
        </div>
      </div>
    </section>
  )
}

export default SupportPage
