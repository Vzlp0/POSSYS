import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader, UserPlus, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import SignupForm from './SignupForm';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const { login, isLoading } = useAuth();
  const { isDarkMode } = useTheme();

  if (showSignup) {
    return <SignupForm onBackToLogin={() => setShowSignup(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid credentials, inactive account, or pending approval');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-xl p-8 transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-800'
      }`}>
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">POS</span>
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>Welcome Back</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>Sign in to your POS system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              isDarkMode 
                ? 'text-red-400 bg-red-900 bg-opacity-50' 
                : 'text-red-600 bg-red-50'
            }`}>
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowSignup(true)}
            className={`flex items-center justify-center space-x-2 font-medium transition-all mx-auto ${
              isDarkMode 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Account</span>
          </button>
        </div>

        <div className={`mt-8 p-4 rounded-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Need Help Signing In?</h3>
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-blue-100 text-blue-700'}`}
            >
              {showCredentials ? 'Hide' : 'Show'} Info
            </button>
          </div>

          {showCredentials && (
            <div className={`text-xs space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="space-y-2">
                <p className="font-medium">Current User in System:</p>
                <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                  <p>Email: <span className="font-mono">ahmed.al.omari@hotmail.com</span></p>
                  <p className="text-xs text-gray-500 mt-1">Password: (Contact admin to reset)</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">To Create New Account:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click "Create New Account" above</li>
                  <li>Fill in your details</li>
                  <li>Sign up with your email & password</li>
                  <li>Use those credentials to sign in</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}