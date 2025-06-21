import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// --- Axios Default Configuration ---
// Set the base URL for all Axios requests.
// Any calls like axios.get('/teachers') will go to 'http://localhost:8000/api/teachers'.
axios.defaults.baseURL = 'http://localhost:8000/api';

// Crucial for Sanctum SPA cookie-based authentication if your frontend and backend
// are on different ports (e.g., localhost:3000 and localhost:8000) or different subdomains
// but share the same top-level domain.
// This allows cookies to be sent with cross-origin requests.
axios.defaults.withCredentials = true;


// --- Create Auth Context ---
const AuthContext = createContext(null); // Initialize with null or a default shape

// --- Custom Hook to use Auth Context ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Auth Provider Component ---
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To track initial auth state loading
  const [authError, setAuthError] = useState('');   // For login/register errors

  // Effect to check for existing token on initial app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('[AuthContext] Initial token from localStorage:', token);

      if (token) {
        // Set the token for all subsequent Axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[AuthContext] Axios default Authorization header SET.');

        // Attempt to fetch user data to validate the token and get user info
        await fetchUserData(); // fetchUserData will set loading to false
      } else {
        console.log('[AuthContext] No token in localStorage on init.');
        setLoading(false); // No token, so not loading user data
      }
    };

    initializeAuth();
  }, []); // Empty dependency array means this runs once on component mount

  // Function to fetch user data using the existing token (if any)
  const fetchUserData = async () => {
    // No need to set loading here, initializeAuth manages overall loading for startup
    try {
      const response = await axios.get('/user'); // Endpoint to get authenticated user
      if (response.data) {
        console.log('[AuthContext] User data fetched successfully:', response.data);
        setCurrentUser(response.data); // Assuming response.data is the user object
                                     // or response.data.data if your UserResource wraps it
      } else {
        // Should not happen if API returns valid JSON, but as a safeguard
        throw new Error("No user data received");
      }
    } catch (err) {
      console.error('[AuthContext] Error fetching user data (token might be invalid/expired):', err);
      // If fetching user fails (e.g., token invalid/expired), log out
      logout(); // This will clear the token and currentUser
    } finally {
      // setLoading(false) is now primarily controlled by initializeAuth context,
      // or after login/register actions directly set loading around API calls.
      // But we must ensure loading is false if fetchUserData is called standalone (though it isn't currently)
      if (loading) setLoading(false);
    }
  };

  // Register function
  const register = async ({ name, email, password, password_confirmation }) => {
    setAuthError(''); // Clear previous errors
    setLoading(true);
    try {
      const response = await axios.post('/register', {
        name,
        email,
        password,
        password_confirmation,
      });

      const { token, user } = response.data; // Assuming backend returns token and user

      if (token && user) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        console.log('[AuthContext] Registration successful, user set:', user);
        setLoading(false);
        return true;
      } else {
        throw new Error("Registration response did not include token or user.");
      }
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      const errorMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ') // Flatten Laravel validation errors
        : err.response?.data?.message
        ? err.response.data.message
        : err.message || 'Failed to register. Please try again.';
      setAuthError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  // Login function
  const login = async (email, password) => {
    setAuthError(''); // Clear previous errors
    setLoading(true);
    try {
      const response = await axios.post('/login', { email, password });
      const { token, user } = response.data; // Assuming backend returns token and user

      if (token && user) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        console.log('[AuthContext] Login successful, user set:', user);
        setLoading(false);
        return true; // Indicate success
      } else {
        // This case should ideally not happen if backend is consistent
        throw new Error("Login response did not include token or user.");
      }
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to login. Please check your credentials.';
      setAuthError(errorMessage);
      setCurrentUser(null); // Ensure user is null on failed login
      setLoading(false);
      return false; // Indicate failure
    }
  };

  // Logout function
  const logout = () => {
    console.log('[AuthContext] Logging out.');
    localStorage.removeItem('token');
    // Remove the Authorization header from Axios defaults
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setAuthError(''); // Clear any auth errors on logout
    // Optionally redirect to login page using history or router context
    // Example: history.push('/login');
  };

  // The value provided to consuming components
  const value = {
    currentUser,
    register,
    login,
    logout,
    authError,    // Renamed from 'error' to be specific to auth actions
    loadingAuth: loading, // Renamed from 'loading' to be specific to initial auth loading
    setAuthError // Allow components to clear auth error if needed
  };

  // Render children only after initial loading is complete to prevent
  // rendering protected routes or user-specific UI prematurely.
  // Or, you can render a global loading spinner here instead of 'null'.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};