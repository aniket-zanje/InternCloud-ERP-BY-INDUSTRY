export const Loading = () => (
  <div className="center">
    <div className="spin" aria-label="Loading" />
  </div>
)

export const ErrorBox = ({ message, onRetry }) => (
  <div className="center">
    <p>{message}</p>
    {onRetry && (
      <button className="btn btn-g" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
)
