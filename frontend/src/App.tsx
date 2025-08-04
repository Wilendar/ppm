import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Theme
import { createPPMTheme } from './theme/theme';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import Dashboard from './components/common/Dashboard';
import ProductsPage from './components/products/ProductsPage';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ppm_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  const theme = useMemo(() => createPPMTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('ppm_dark_mode', JSON.stringify(newDarkMode));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppLayout darkMode={darkMode} onThemeToggle={handleThemeToggle}>
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Products */}
              <Route path="/products" element={<ProductsPage />} />
              
              {/* Placeholder routes for future features */}
              <Route path="/shops" element={<ComingSoon feature="Shop Management" etap="2.2" />} />
              <Route path="/categories" element={<ComingSoon feature="Category Management" etap="2.3" />} />
              <Route path="/analytics" element={<ComingSoon feature="Analytics Dashboard" etap="5.2" />} />
              <Route path="/settings" element={<ComingSoon feature="Settings" etap="Future" />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
        
        {/* React Query Devtools in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Coming Soon placeholder component
const ComingSoon: React.FC<{ feature: string; etap: string }> = ({ feature, etap }) => (
  <div style={{ textAlign: 'center', padding: '4rem' }}>
    <h2>{feature}</h2>
    <p>This feature is planned for ETAP {etap}</p>
    <p>Coming soon...</p>
  </div>
);

export default App;
