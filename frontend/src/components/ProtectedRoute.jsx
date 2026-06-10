import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let user = null;

  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
  }

  if (!token || !user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    // Redirect standard users to dashboard if trying to access admin dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
