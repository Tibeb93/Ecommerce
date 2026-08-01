import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-7xl font-bold text-[var(--primary)] mb-4">404</h1>
    <p className="text-xl text-[var(--muted)] mb-2">Page not found</p>
    <p className="text-sm text-[var(--muted)] mb-8 max-w-md">
      The page you&apos;re looking for doesn&apos;t exist or has been moved.
    </p>
    <Link to="/" className="btn px-6 py-3 text-white font-medium">
      Back to Home
    </Link>
  </div>
);

export default NotFound;
