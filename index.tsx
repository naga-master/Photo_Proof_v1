
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import OnboardingPage from './src/pages/OnboardingPage';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Check if current path is onboarding
const isOnboardingPath = window.location.pathname.startsWith('/onboarding');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isOnboardingPath ? (
      <OnboardingPage />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
