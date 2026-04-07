export default function Header({ view, onNavigate, savedCount }) {
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
              Extract
            </button>
            <button
              className="nav-link"
              onClick={() => onNavigate('cookbook')}
              aria-current={view === 'cookbook' ? 'page' : undefined}
            >
              My Cookbook {savedCount > 0 && `(${savedCount})`}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
