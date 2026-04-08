export default function Header({ view, onNavigate, savedCount, onUpgrade, theme, onToggleTheme, user, onLogin, onLogout }) {
  return (
    <header className="app-header">
      <div className="container">
        <div className="header-inner">
          <a className="logo" onClick={() => onNavigate('home')} href="#" role="banner">
            <span className="logo-icon">🍴</span>
            <span className="logo-wordmark">Recipe<span>Snap</span></span>
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            <button
              className="nav-link"
              onClick={() => onNavigate('home')}
              aria-current={view === 'home' ? 'page' : undefined}
            >
              Extract/Search
            </button>
            <button
              className="nav-link"
              onClick={() => onNavigate('cookbook')}
              aria-current={view === 'cookbook' ? 'page' : undefined}
            >
              My Cookbook {savedCount > 0 && `(${savedCount})`}
            </button>
            <button
              className="nav-link"
              onClick={() => onNavigate('planner')}
              aria-current={view === 'planner' ? 'page' : undefined}
            >
              Planner
            </button>
            <button
              className="nav-link"
              onClick={onToggleTheme}
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {user ? (
              <div className="user-profile">
                <button className="nav-link profile-btn" title={user.user_metadata?.full_name || 'My Account'}>
                  👤 {user.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                </button>
                <div className="profile-dropdown">
                  <button onClick={onLogout} className="dropdown-item">Logout</button>
                </div>
              </div>
            ) : (
              <button className="nav-link" onClick={onLogin}>Login</button>
            )}

            <button
              className="nav-link go-pro-btn"
              onClick={onUpgrade}
              style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}
            >
              ⭐ Go Pro
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
