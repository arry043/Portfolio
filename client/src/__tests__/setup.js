import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage if needed, though jsdom provides it
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});
