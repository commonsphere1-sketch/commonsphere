import { Link, useLocation } from "react-router-dom";

export function Breadcrumbs() {
  const location = useLocation();
  if (location.pathname === "/") return null;
  const parts = location.pathname.split("/").filter(Boolean);
  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm text-gray-500 flex gap-1">
      <Link to="/" className="hover:text-blue-600">Home</Link>
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          <span>/</span>
          <span className="capitalize">{part.replace(/-/g, " ")}</span>
        </span>
      ))}
    </nav>
  );
}
