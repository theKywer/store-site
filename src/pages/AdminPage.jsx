
import { useState } from 'react'

function AdminPage({ games, isLoading, error, setGames, onGameDeleted }) {
  const [gameTitle, setGameTitle] = useState('')
  const [gamePrice, setGamePrice] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addGameError, setAddGameError] = useState(null)

  const [editingGameId, setEditingGameId] = useState(null)
  const [editGameTitle, setEditGameTitle] = useState('')
  const [editGamePrice, setEditGamePrice] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editGameError, setEditGameError] = useState(null)

  const [deletingGameId, setDeletingGameId] = useState(null)
  const [deleteGameError, setDeleteGameError] = useState(null)

  // Добавление игры
  async function addGame(event) {
    event.preventDefault()

    setIsAdding(true)
    setAddGameError(null)

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: gameTitle.trim(),
          price: Number(gamePrice),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось добавить игру')
      }

      setGames((currentGames) => [...currentGames, data])

      setGameTitle('')
      setGamePrice('')
    } catch (error) {
      setAddGameError(error.message)
    } finally {
      setIsAdding(false)
    }
  }

  // Начало редактирования
  function startEditing(game) {
    setEditingGameId(game.id)
    setEditGameTitle(game.title)
    setEditGamePrice(String(game.price))
    setEditGameError(null)
  }

  // Отмена редактирования
  function cancelEditing() {
    setEditingGameId(null)
    setEditGameTitle('')
    setEditGamePrice('')
    setEditGameError(null)
  }

  // Сохранение изменений
  async function saveGame(event) {
    event.preventDefault()

    setIsSavingEdit(true)
    setEditGameError(null)

    try {
      const response = await fetch(`/api/games/${editingGameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editGameTitle.trim(),
          price: Number(editGamePrice),
        }),
      })

      const updatedGame = await response.json()

      if (!response.ok) {
        throw new Error(updatedGame.message || 'Не удалось изменить игру')
      }

      setGames((currentGames) =>
        currentGames.map((game) =>
          game.id === updatedGame.id
            ? { ...game, ...updatedGame }
            : game,
        ),
      )

      cancelEditing()
    } catch (error) {
      setEditGameError(error.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Удаление игры
  async function deleteGame(gameId) {
    const confirmed = window.confirm(
      'Ты действительно хочешь удалить эту игру?',
    )

    if (!confirmed) return

    setDeletingGameId(gameId)
    setDeleteGameError(null)

    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось удалить игру')
      }

      setGames((currentGames) =>
        currentGames.filter((game) => game.id !== gameId),
      )

      onGameDeleted(gameId)
    } catch (error) {
      setDeleteGameError(error.message)
    } finally {
      setDeletingGameId(null)
    }
  }

  return (
    <section className="admin-page">
      <h1>Управление магазином</h1>

      <section className="admin-add-game">
        <h2>Добавить игру</h2>

        <form onSubmit={addGame}>
          <div>
            <label htmlFor="admin-game-title">
              Название игры
            </label>

            <input
              id="admin-game-title"
              type="text"
              value={gameTitle}
              onChange={(event) => setGameTitle(event.target.value)}
              placeholder="Например, Elden Ring"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-game-price">
              Цена игры
            </label>

            <input
              id="admin-game-price"
              type="number"
              value={gamePrice}
              onChange={(event) => setGamePrice(event.target.value)}
              placeholder="24999"
              min="0"
              step="1"
              required
            />
          </div>

          <button type="submit" disabled={isAdding}>
            {isAdding ? 'Добавление...' : 'Добавить игру'}
          </button>
        </form>

        {addGameError && <p>Ошибка: {addGameError}</p>}
      </section>

      <section className="admin-game-list">
        <h2>Каталог игр ({games.length})</h2>

        {isLoading && <p>Загрузка игр...</p>}
        {error && <p>Ошибка загрузки: {error}</p>}
        {deleteGameError && <p>Ошибка удаления: {deleteGameError}</p>}

        {!isLoading && !error && games.length === 0 && (
          <p>Игры не найдены.</p>
        )}

        {!isLoading &&
          !error &&
          games.map((game) => (
            <article className="admin-game-item" key={game.id}>
              {editingGameId === game.id ? (
                <form onSubmit={saveGame}>
                  <div>
                    <label htmlFor={`edit-title-${game.id}`}>
                      Название игры
                    </label>

                    <input
                      id={`edit-title-${game.id}`}
                      type="text"
                      value={editGameTitle}
                      onChange={(event) =>
                        setEditGameTitle(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`edit-price-${game.id}`}>
                      Цена игры
                    </label>

                    <input
                      id={`edit-price-${game.id}`}
                      type="number"
                      value={editGamePrice}
                      onChange={(event) =>
                        setEditGamePrice(event.target.value)
                      }
                      min="0"
                      step="1"
                      required
                    />
                  </div>

                  <button type="submit" disabled={isSavingEdit}>
                    {isSavingEdit ? 'Сохранение...' : 'Сохранить'}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSavingEdit}
                  >
                    Отмена
                  </button>

                  {editGameError && <p>Ошибка: {editGameError}</p>}
                </form>
              ) : (
                <>
                  <div>
                    <strong>{game.title}</strong>
                    <p>{game.price} ₸</p>
                  </div>

                  <div className="admin-game-actions">
                    <button
                      type="button"
                      onClick={() => startEditing(game)}
                      disabled={deletingGameId !== null || isSavingEdit}
                    >
                      Редактировать
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteGame(game.id)}
                      disabled={deletingGameId !== null || isSavingEdit}
                    >
                      {deletingGameId === game.id
                        ? 'Удаление...'
                        : 'Удалить'}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
      </section>
    </section>
  )
}

export default AdminPage
