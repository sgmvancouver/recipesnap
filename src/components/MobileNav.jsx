export default function MobileNav({ view, onNavigate, hasPro }) {
  const links = [
    { id: 'home', icon: '📝', label: 'Extract/Search' },
    { id: 'cookbook', icon: '📖', label: 'Books' },
    { id: 'shopping-list', icon: '🛒', label: 'List' },
    { id: 'pro', icon: '⭐', label: 'Pro' }
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation Bar">
      <div className="mobile-nav-inner">
        {links.map(link => (
          <button
            key={link.id}
            className={`mobile-nav-item ${view === link.id ? 'active' : ''}`}
            onClick={() => onNavigate(link.id === 'pro' ? 'cookbook' : link.id)}
            aria-current={view === link.id ? 'page' : undefined}
          >
            <span className="mobile-nav-icon" aria-hidden="true">{link.icon}</span>
            <span className="mobile-nav-label">{link.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
