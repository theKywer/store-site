function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => (
        <div
          className={`toast toast-${toast.type}${toast.isLeaving ? ' is-leaving' : ''}`}
          key={toast.id}
          role="status"
        >
          <span className="toast-icon" aria-hidden="true">
            {toast.type === 'favorite' ? '♡' : '✓'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Закрыть уведомление"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastViewport
