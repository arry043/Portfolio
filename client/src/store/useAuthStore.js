import { create } from 'zustand';

const USER_STORAGE_KEY = 'portfolio_user';
const TOKEN_STORAGE_KEY = 'portfolio_token';

const parseStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const normalizeAuthUser = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return null;
  }

  return {
    _id: userData._id || userData.id || null,
    name: userData.name || '',
    email: String(userData.email || '').trim().toLowerCase(),
    role: userData.role || 'user',
    provider: userData.provider || 'local',
    profileImage: userData.profileImage || userData.imageUrl || '',
    createdAt: userData.createdAt || null,
  };
};

const writeAuthToStorage = (user, token) => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const initialToken = localStorage.getItem(TOKEN_STORAGE_KEY) || null;
const initialUser = parseStoredUser();

// Sync state directly from LocalStorage to survive page reloads
const useAuthStore = create((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,

  login: (userData, token) => {
    const normalizedUser = normalizeAuthUser(userData);
    const safeToken = token || null;
    writeAuthToStorage(normalizedUser, safeToken);
    set({ user: normalizedUser, token: safeToken, isAuthenticated: Boolean(safeToken) });
  },

  updateUser: (userData) => {
    const normalizedUser = normalizeAuthUser(userData);
    writeAuthToStorage(normalizedUser, localStorage.getItem(TOKEN_STORAGE_KEY));
    set((state) => ({
      user: normalizedUser,
      token: state.token,
      isAuthenticated: !!state.token,
    }));
  },

  logout: () => {
    clearAuthStorage();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
