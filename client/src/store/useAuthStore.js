import { create } from 'zustand';

// Syncs state directly from LocalStorage to survive page reloads
const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('portfolio_user')) || null,
  token: localStorage.getItem('portfolio_token') || null,
  isAuthenticated: !!localStorage.getItem('portfolio_token'),
  
  login: (userData, token) => {
    localStorage.setItem('portfolio_user', JSON.stringify(userData));
    localStorage.setItem('portfolio_token', token);
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('portfolio_token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
