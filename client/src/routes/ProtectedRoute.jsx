/**
 * routes/ProtectedRoute.jsx
 * Redirects unauthenticated users to /login.
 * Wrap any private <Route> element with this component.
 *
 * Usage (inside App.jsx Routes):
 *   <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 *
 * Requires react-router-dom.
 * TODO: install react-router-dom  →  npm install react-router-dom
 */

// Stub — activate after installing react-router-dom
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
//
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated } = useAuth();
//   const location = useLocation();
//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }
//   return children;
// };
// export default ProtectedRoute;

const ProtectedRoute = ({ children }) => children;
export default ProtectedRoute;
