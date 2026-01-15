import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('No session found');
        }

        // Exchange Supabase session for backend JWT
        const response = await api.auth.googleCallback({
          accessToken: session.access_token,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url
          }
        });

        // Store the JWT token and user info
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-error-200 p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Failed
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                     hover:bg-primary-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-primary-600" />
        </div>
        <div className="flex items-center gap-3 justify-center mb-4">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
          <span className="text-lg font-medium text-gray-900">Completing sign in...</span>
        </div>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
