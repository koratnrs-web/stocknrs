
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StockProvider } from './contexts/StockContext';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Login from './pages/Login';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Movements from './pages/Movements';
import Scanner from './pages/Scanner';
import BudgetRequest from './pages/BudgetRequest';
import ApprovalPage from './pages/ApprovalPage';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <StockProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute>
              <Suppliers />
            </ProtectedRoute>
          } />
          <Route path="/movements" element={
            <ProtectedRoute>
              <Movements />
            </ProtectedRoute>
          } />
          <Route path="/scanner" element={
            <ProtectedRoute>
              <Scanner />
            </ProtectedRoute>
          } />
          <Route path="/budget-request" element={
            <ProtectedRoute>
              <BudgetRequest />
            </ProtectedRoute>
          } />
          <Route path="/approval" element={
            <ProtectedRoute>
              <ApprovalPage />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </StockProvider>
  );
}

export default App;
