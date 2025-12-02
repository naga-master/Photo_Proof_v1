
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './src/index.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import OnboardingPage from './src/pages/OnboardingPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import { StudioThemeProvider } from './src/providers/StudioThemeProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding/*" element={<OnboardingPage />} />
        <Route path="/forgot-password" element={
          <StudioThemeProvider>
            <ForgotPasswordPage />
          </StudioThemeProvider>
        } />
        <Route path="/reset-password" element={
          <StudioThemeProvider>
            <ResetPasswordPage />
          </StudioThemeProvider>
        } />
        <Route path="/*" element={
          <AuthProvider>
            <App />
          </AuthProvider>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
