import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validators';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    setErrors({});
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // The redirect will happen automatically via Supabase OAuth
    } catch (err) {
      setErrors({ submit: err.message || 'Google signup failed. Please try again.' });
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await signup(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setErrors({ submit: err.message || 'Signup failed. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Visual (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-800 p-12 items-center justify-center">
        <div className="max-w-md text-white space-y-6">
          <h2 className="text-4xl font-bold">
            Start Your Learning Journey
          </h2>
          <p className="text-xl text-primary-100">
            Join students transforming how they learn from research content.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">$0</div>
              <div className="text-sm text-primary-100">Completely Free</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">5 min</div>
              <div className="text-sm text-primary-100">Setup Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">∞</div>
              <div className="text-sm text-primary-100">Videos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
              Create your account
            </h1>
            <p className="text-base text-gray-600">
              Get started for free. No credit card required.
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-error-700">{errors.submit}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pl-10 bg-white border-2 rounded-lg
                           focus:outline-none placeholder:text-gray-400 transition-all
                           ${errors.name
                             ? 'border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-500 focus:ring-opacity-20'
                             : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20'
                           }`}
                  placeholder="John Doe"
                  required
                />
                <User className={`absolute left-3 top-3.5 w-5 h-5 ${errors.name ? 'text-error-600' : 'text-gray-400'}`} />
              </div>
              {errors.name && (
                <p className="text-sm text-error-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pl-10 bg-white border-2 rounded-lg
                           focus:outline-none placeholder:text-gray-400 transition-all
                           ${errors.email
                             ? 'border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-500 focus:ring-opacity-20'
                             : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20'
                           }`}
                  placeholder="you@college.edu"
                  required
                />
                <Mail className={`absolute left-3 top-3.5 w-5 h-5 ${errors.email ? 'text-error-600' : 'text-gray-400'}`} />
              </div>
              {errors.email && (
                <p className="text-sm text-error-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pl-10 bg-white border-2 rounded-lg
                           focus:outline-none placeholder:text-gray-400 transition-all
                           ${errors.password
                             ? 'border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-500 focus:ring-opacity-20'
                             : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20'
                           }`}
                  placeholder="••••••••"
                  required
                />
                <Lock className={`absolute left-3 top-3.5 w-5 h-5 ${errors.password ? 'text-error-600' : 'text-gray-400'}`} />
              </div>
              {errors.password && (
                <p className="text-sm text-error-600">{errors.password}</p>
              )}
              {!errors.password && (
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pl-10 bg-white border-2 rounded-lg
                           focus:outline-none placeholder:text-gray-400 transition-all
                           ${errors.confirmPassword
                             ? 'border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-500 focus:ring-opacity-20'
                             : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20'
                           }`}
                  placeholder="••••••••"
                  required
                />
                <Lock className={`absolute left-3 top-3.5 w-5 h-5 ${errors.confirmPassword ? 'text-error-600' : 'text-gray-400'}`} />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-error-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) {
                      setErrors(prev => ({ ...prev, terms: '' }));
                    }
                  }}
                  className="w-4 h-4 mt-1 border-gray-300 rounded text-primary-600
                           focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.terms && (
                <p className="text-sm text-error-600">{errors.terms}</p>
              )}
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
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-t border-gray-300" />
            <span className="text-sm text-gray-500">Or sign up with</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignup}
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

          {/* Log In Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
