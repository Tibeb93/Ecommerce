import { Link } from "react-router-dom";

const ServerError = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-7xl font-bold text-red-400 mb-4">500</h1>
    <p className="text-xl text-[var(--muted)] mb-2">Something went wrong</p>
    <p className="text-sm text-[var(--muted)] mb-8 max-w-md">
      The server encountered an unexpected issue. Please try again later.
    </p>
    <div className="flex gap-3">
      <button onClick={() => window.location.reload()} className="btn px-6 py-3 text-white font-medium">
        Try Again
      </button>
      <Link to="/" className="btn ghost px-6 py-3 font-medium">
        Back to Home
      </Link>
    </div>
  </div>
);

export default ServerError;
