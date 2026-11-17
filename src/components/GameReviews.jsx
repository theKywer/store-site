import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import { apiFetch, fetchReviews } from '../api.js'
import './GameReviews.css'

function Stars({ value, onChange, label = 'Оценка' }) {
  return <div className="review-stars" role={onChange ? 'radiogroup' : 'img'} aria-label={`${label}: ${value} из 5`}>
    {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" disabled={!onChange} role={onChange ? 'radio' : undefined} aria-checked={onChange ? n === value : undefined} aria-label={`${n} из 5`} className={n <= value ? 'filled' : ''} onClick={() => onChange?.(n)} onKeyDown={(e) => { if (onChange && ['ArrowRight', 'ArrowUp'].includes(e.key)) { e.preventDefault(); onChange(Math.min(5, n + 1)) } if (onChange && ['ArrowLeft', 'ArrowDown'].includes(e.key)) { e.preventDefault(); onChange(Math.max(1, n - 1)) } }}>★</button>)}</div>
}

export default function GameReviews({ gameId }) {
  const { token, user } = useAuth()
  const [data, setData] = useState({ reviews: [], averageRating: 0, total: 0, page: 1 })
  const [rating, setRating] = useState(0), [text, setText] = useState(''), [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('')
  const load = useCallback(async (page = 1) => { setLoading(true); try { setData(await fetchReviews(gameId, page)) } catch (e) { setError(e.message) } finally { setLoading(false) } }, [gameId])
  useEffect(() => { load() }, [load])
  async function submit(e) {
    e.preventDefault(); setError(''); setSuccess('')
    if (!rating) return setError('Выберите оценку')
    if (text.trim().length < 10 || text.trim().length > 1000) return setError('Текст должен содержать от 10 до 1000 символов')
    setSaving(true)
    try { const response = await apiFetch(editing ? `/api/games/${gameId}/reviews/${editing}` : `/api/games/${gameId}/reviews`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rating, text: text.trim() }) }); const contentType = response.headers.get('content-type') || ''; const body = response.status === 204 ? null : contentType.includes('application/json') ? await response.json() : null; if (!response.ok) throw new Error(body?.message || 'Сервер API недоступен. Проверьте адрес API и его запуск.'); setText(''); setRating(0); setEditing(null); setSuccess('Отзыв сохранён'); await load() } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  async function remove(id, isOwnReview = true) { if (!window.confirm(isOwnReview ? 'Удалить свой отзыв?' : 'Удалить отзыв пользователя?')) return; setError(''); try { const response = await apiFetch(`/api/games/${gameId}/reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('Не удалось удалить отзыв'); await load() } catch (e) { setError(e.message) } }
  return (
    <section className="game-reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title">Отзывы пользователей</h2>
      <div className="reviews-summary">
        <strong>{data.averageRating.toFixed(1)}</strong>
        <Stars value={Math.round(data.averageRating)} />
        <span>{data.total} отзывов</span>
      </div>

      {token && user ? (
        <form className="review-form" onSubmit={submit}>
          <h3>{editing ? 'Редактировать отзыв' : 'Оставить отзыв'}</h3>
          <Stars value={rating} onChange={setRating} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} minLength={10} maxLength={1000} placeholder="Расскажите об игре (10–1000 символов)" required />
          <small>{text.trim().length}/1000</small>
          <button disabled={saving}>{saving ? 'Сохраняем…' : 'Опубликовать'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setText(''); setRating(0) }}>Отмена</button>}
        </form>
      ) : (
        <p className="reviews-login">Оставлять отзывы могут только зарегистрированные пользователи. <Link to="/login">Войдите</Link> или <Link to="/register">зарегистрируйтесь</Link>.</p>
      )}

      {error && <p className="review-message error" role="alert">{error}</p>}
      {success && <p className="review-message">{success}</p>}

      {loading ? (
        <p>Загружаем отзывы…</p>
      ) : data.total === 0 ? (
        <div className="reviews-empty"><span>✦</span><h3>Пока нет отзывов</h3><p>Поделитесь впечатлением об игре первым!</p></div>
      ) : (
        <>
          <div className="review-list">
            {data.reviews.map((r) => (
              <article className="review-card" key={r.id}>
                <div className="review-author">
                  {r.author.avatar ? <img src={r.author.avatar} alt="" /> : <span>{r.author.name[0]}</span>}
                  <div className="review-author-details"><strong>{r.author.name}</strong><small>{String(Number(user?.id) === Number(r.userId) ? user.role : r.author.role).trim().toUpperCase() === 'ADMIN' ? 'Администратор' : 'Пользователь'}</small></div>
                  <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                <Stars value={r.rating} />
                <p>{r.text}</p>
                {user && (Number(user.id) === Number(r.userId) || String(user.role).trim().toUpperCase() === 'ADMIN') && (
                  <div>
                    {Number(user.id) === Number(r.userId) && <button type="button" onClick={() => { setEditing(r.id); setText(r.text); setRating(r.rating); document.querySelector('.review-form')?.scrollIntoView({ behavior: 'smooth' }) }}>Изменить</button>}
                    <button type="button" onClick={() => remove(r.id, Number(user.id) === Number(r.userId))}>{Number(user.id) === Number(r.userId) ? 'Удалить' : 'Удалить отзыв'}</button>
                  </div>
                )}
              </article>
            ))}
          </div>
          {Math.ceil(data.total / data.limit) > 1 && (
            <nav className="review-pagination" aria-label="Страницы отзывов">
              <button type="button" disabled={data.page <= 1} onClick={() => load(data.page - 1)}>Назад</button>
              <span>{data.page} / {Math.ceil(data.total / data.limit)}</span>
              <button type="button" disabled={data.page >= Math.ceil(data.total / data.limit)} onClick={() => load(data.page + 1)}>Далее</button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
