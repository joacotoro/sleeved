import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative px-3 py-1.5 text-sm font-body transition-colors duration-150 ${
          isActive
            ? "text-vault-gold"
            : "text-vault-muted hover:text-vault-cream"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span className="absolute bottom-0 left-3 right-3 h-px bg-vault-gold opacity-60" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-vault-black flex flex-col">
      <header className="border-b border-vault-border bg-vault-darker/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-8">
          {/* Logo */}
          <NavLink to="/" className="flex items-center mr-2 shrink-0">
            <span className="font-cinzel text-vault-gold text-lg tracking-[0.15em] font-semibold">
              SLEEVED
            </span>
          </NavLink>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/cards">Cards</NavItem>
            <NavItem to="/decks">Decks</NavItem>
          </nav>

          {/* User */}
          {user && (
            <div className="flex items-center gap-3 ml-auto">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-vault-border"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-vault-card border border-vault-border flex items-center justify-center">
                  <span className="text-vault-gold text-xs font-cinzel font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
              <span className="text-vault-muted text-sm hidden sm:block">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-vault-faint hover:text-vault-muted text-xs px-2 py-1 rounded transition-colors border border-transparent hover:border-vault-border"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
