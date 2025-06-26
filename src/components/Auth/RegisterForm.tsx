import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  
  const { register, loginWithGoogle, isLoading } = useAuthStore();

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await register(email, password, name);
    } catch (error) {
      setErrors({ email: 'Registration failed. Please try again.' });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">T</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create account
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Start your journey with AI-powered travel planning
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.name 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              } text-gray-900 dark:text-gray-100`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.email 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              } text-gray-900 dark:text-gray-100`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.password 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              } text-gray-900 dark:text-gray-100`}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.confirmPassword 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              } text-gray-900 dark:text-gray-100`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I accept the{' '}
              <button type="button" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </button>
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.terms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Create account'
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Google</span>
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <button
          onClick={onToggleMode}
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};