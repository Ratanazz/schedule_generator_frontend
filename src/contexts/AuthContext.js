import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// --- Axios Default Configuration ---
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
axios.defaults.withCredentials = true; // For Sanctum cookie-based SPA auth if used, or if other cookies are needed.
                                      // For pure token-based auth with Bearer tokens, this is less critical
                                      // but doesn't harm.

// --- Create Auth Context ---
const AuthContext = createContext(null);

// --- Custom Hook to use Auth Context ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { // Check for undefined, as null is a valid initial context value
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Auth Provider Component ---
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // Renamed for clarity: tracks loading for any auth operation (initial check, login, register)
  const [isAuthOperationLoading, setIsAuthOperationLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing authentication...');
      setIsAuthOperationLoading(true); // Explicitly set loading at the start of init
      const token = localStorage.getItem('token');
      console.log('[AuthContext] Initial token from localStorage:', token);

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[AuthContext] Axios default Authorization header SET.');
        await fetchUserData(); // This will attempt to fetch user and manage loading state
      } else {
        console.log('[AuthContext] No token in localStorage on init.');
        setCurrentUser(null); // Ensure user is null if no token
        delete axios.defaults.headers.common['Authorization']; // Clear header if no token
        setIsAuthOperationLoading(false); // No token, finished loading for init
      }
    };

    initializeAuth();
  }, []); // Runs once on component mount

  const fetchUserData = async () => {
    // This function is typically called when a token exists.
    // The calling function (initializeAuth or login/register) should manage the loading state around it.
    try {
      console.log('[AuthContext] Attempting to fetch user data...');
      const response = await axios.get('/user'); // Endpoint to get authenticated user
      if (response.data) {
        // Assuming backend directly returns user object or user object is at response.data.data for UserResource
        const userData = response.data.data || response.data;
        console.log('[AuthContext] User data fetched successfully:', userData);
        setCurrentUser(userData);
      } else {
        throw new Error("No user data received from /user endpoint");
      }
    } catch (err) {
      console.error('[AuthContext] Error fetching user data (token might be invalid/expired):', err);
      // If fetching user fails, it implies the token is invalid or expired.
      // Log out to clear inconsistent state.
      logoutAction(false); // Pass false to avoid redundant console log if called from logout itself
    } finally {
      // Ensure loading is false after attempting to fetch user data,
      // especially if initializeAuth was the caller.
      setIsAuthOperationLoading(false);
    }
  };

  // --- Register Function ---
  const register = async ({ name, email, password, password_confirmation }) => {
    setAuthError('');
    setIsAuthOperationLoading(true);
    console.log('[AuthContext] Attempting registration for:', email);

    try {
      // For Sanctum SPA cookie-based auth, you'd typically call:
      // await axios.get('/sanctum/csrf-cookie');
      // However, this setup uses Bearer tokens, so it's not strictly needed here.

      const response = await axios.post('/register', {
        name,
        email,
        password,
        password_confirmation,
      });

      // The backend is expected to return { user: {..., role: 'admin'/'user', ...}, token: '...' }
      const { user, token } = response.data;

      if (token && user) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user); // The 'user' object from backend includes the 'role'
        console.log('[AuthContext] Registration successful. User (with role) set:', user);
        setIsAuthOperationLoading(false);
        return true; // Indicate success
      } else {
        // This should ideally not happen if the backend API is consistent
        throw new Error("Registration response did not include token or user data.");
      }
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      let errorMessage = 'Failed to register. Please try again.';
      if (err.response) {
        // Laravel validation errors (HTTP 422)
        if (err.response.data && err.response.data.errors) {
          errorMessage = Object.values(err.response.data.errors).flat().join(' ');
        } else if (err.response.data && err.response.data.message) {
          // Other error messages from backend
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        // Network errors or errors thrown in the try block
        errorMessage = err.message;
      }
      setAuthError(errorMessage);
      setCurrentUser(null); // Ensure user is null on failed registration
      setIsAuthOperationLoading(false);
      return false; // Indicate failure
    }
  };

  // --- Login Function ---
  const login = async (email, password) => {
    setAuthError('');
    setIsAuthOperationLoading(true);
    console.log('[AuthContext] Attempting login for:', email);

    try {
      // For Sanctum SPA cookie-based auth, you'd typically call:
      // await axios.get('/sanctum/csrf-cookie');

      const response = await axios.post('/login', { email, password });
      const { user, token } = response.data;

      if (token && user) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user); // User object from backend includes the role
        console.log('[AuthContext] Login successful. User (with role) set:', user);
        setIsAuthOperationLoading(false);
        return true;
      } else {
        throw new Error("Login response did not include token or user data.");
      }
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      let errorMessage = 'Failed to login. Please check your credentials.';
       if (err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
         // You might also have validation errors for login (e.g. malformed email)
         if (err.response.data && err.response.data.errors) {
            errorMessage = Object.values(err.response.data.errors).flat().join(' ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setAuthError(errorMessage);
      setCurrentUser(null);
      setIsAuthOperationLoading(false);
      return false;
    }
  };

  // Internal logout action to handle state changes
  const logoutAction = (logMessage = true) => {
    if (logMessage) console.log('[AuthContext] Logging out.');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setAuthError('');
    // setIsAuthOperationLoading(false); // Typically, logout is quick, but if it involved an API call, you'd manage loading.
  };

  // --- Logout Function (exposed to consumers) ---
  const logout = () => {
    // If logout involved an API call (e.g., to invalidate token server-side):
    // setIsAuthOperationLoading(true);
    // try {
    //   await axios.post('/logout');
    // } catch (e) { console.error("Server logout error", e); }
    // finally {
    //   logoutAction();
    //   setIsAuthOperationLoading(false);
    // }
    logoutAction(); // For client-side only logout
  };

  const value = {
    currentUser,
    register,
    login,
    logout,
    authError,
    authLoading: isAuthOperationLoading, // Expose consistent loading state name
    setAuthError, // Allow components to clear auth error
    fetchUserData // Expose if needed for manual refresh, though typically handled internally
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};