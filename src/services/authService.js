/**
 * Wrapper for Netlify Identity Widget
 */

export const initAuth = (onUserChange) => {
  if (typeof window === 'undefined') return;

  const netlifyIdentity = window.netlifyIdentity;
  if (!netlifyIdentity) {
    console.error('Netlify Identity widget not loaded');
    return;
  }

  netlifyIdentity.on('init', user => onUserChange(user));
  netlifyIdentity.on('login', user => {
    onUserChange(user);
    netlifyIdentity.close();
  });
  netlifyIdentity.on('logout', () => onUserChange(null));
  
  // Return cleanup
  return () => {
    netlifyIdentity.off('init');
    netlifyIdentity.off('login');
    netlifyIdentity.off('logout');
  };
};

export const login = () => {
  window.netlifyIdentity?.open();
};

export const logout = () => {
  window.netlifyIdentity?.logout();
};

export const getCurrentUser = () => {
  return window.netlifyIdentity?.currentUser() || null;
};
