import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, XCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // The redirect will happen automatically via Supabase OAuth
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <GraduationCap className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">Learn.AI</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-base text-gray-600">
              Log in to continue your learning journey
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6
                          flex items-start gap-3">
              <XCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-300 rounded-lg
                           focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20
                           focus:outline-none placeholder:text-gray-400 transition-all"
                  placeholder="you@college.edu"
                  required
                />
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-300 rounded-lg
                           focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20
                           focus:outline-none placeholder:text-gray-400 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded text-primary-600
                           focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                       hover:bg-primary-700 active:bg-primary-800
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-gray-300" />
            <span className="text-sm text-gray-500">Or continue with</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-medium
                           text-gray-700 hover:bg-gray-50 hover:border-gray-400
                           transition-colors flex items-center justify-center gap-3
                           disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-800 p-12 items-center justify-center">
        <div className="max-w-md text-white space-y-6">
          <h2 className="text-4xl font-bold">
            Learn Faster with AI
          </h2>
          <p className="text-xl text-primary-100">
            Transform complex research papers into 5-10 minute videos and get instant feedback on your projects.
          </p>
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg">100+ curated educational videos</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg">Custom video generation</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg">AI code review for your projects</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
