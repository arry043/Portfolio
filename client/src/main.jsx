import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';

// Read publishable key with debug log
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
console.log(`[CLERK INIT] Publishable Key is: ${PUBLISHABLE_KEY ? 'Present' : 'Missing'}`);

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key (VITE_CLERK_PUBLISHABLE_KEY)");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <LoadingProvider>
          <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <App />
          </ClerkProvider>
        </LoadingProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>
);
