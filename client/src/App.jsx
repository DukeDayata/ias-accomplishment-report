import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Layout from './components/layout/Layout';

// Pages Placeholder
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AccomplishmentsManager from './pages/Accomplishments';
import ReportReview from './pages/Reports/ReportReview';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some(role => user?.role?.startsWith(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function App() {
  const { user } = useAuthStore();
  
  // Theme initialization could go here
  useEffect(() => {
    document.documentElement.classList.add('bg-slate-50', 'text-slate-900');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="accomplishments" element={
            <ProtectedRoute allowedRoles={['Regional Director', 'Regional Administrator or IZN Focal Person', 'Regional Encoder or Project Technical Staff']}>
              <AccomplishmentsManager />
            </ProtectedRoute>
          } />

          <Route path="reviews" element={
            <ProtectedRoute allowedRoles={['IAS Monitoring Officer', 'IAS Super Administrator']}>
              <ReportReview />
            </ProtectedRoute>
          } />


          <Route path="users" element={
            <ProtectedRoute allowedRoles={['IAS Super Administrator']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="unauthorized" element={<div className="p-8 text-center text-red-600 font-bold text-xl">Unauthorized Access</div>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
