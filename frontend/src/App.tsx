import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { isAuthenticated, getUser, getToken, removeToken } from './utils/auth';
import { jwtDecode } from 'jwt-decode';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgetPassword';
import ResetPassword from './pages/ResetPassword';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Students from './pages/Students';
import Dues from './pages/Dues';
import Certificates from './pages/Certificates';
import Departments from './pages/Departments';
import NoDuesCertificate from './pages/NoDuesCertificate';
import Layout from './components/Layout/Layout';

// import {
//   QueryClient,
//   QueryClientProvider
// } from '@tanstack/react-query'

// const queryClient = new QueryClient()

// Protected route with layout component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const storedUser = getUser();
  
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }
  
  const token = getToken();
  if (token) {
    try {
      interface DecodedToken {
        exp: number;
        [key: string]: unknown; // Add other properties as needed
      }
      const decoded: DecodedToken = jwtDecode<DecodedToken>(token);
      if (decoded.exp < Date.now() / 1000) {
        removeToken();
        return <Navigate to="/login" replace />;
      }
    } catch {
      removeToken();
      return <Navigate to="/login" replace />;
    }
  }
  
  return <Layout>{children}</Layout>;
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});



function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/dues" element={<ProtectedRoute><Dues /></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/certificates/:id" element={<ProtectedRoute><NoDuesCertificate /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
            
            {/* Root route */}
            <Route path="/" element={
              isAuthenticated() ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
