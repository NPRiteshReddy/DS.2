import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, AlertCircle, Clock, Video, Bookmark, Info, Link as LinkIcon, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateURL } from '../utils/validators';
import api from '../services/api';

const CreateVideoPage = () => {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // URL validation
    if (!validateURL(url)) {
      setIsValid(false);
      setError('Please enter a valid URL');
      return;
    }

    setIsValid(true);
    setIsGenerating(true);
    setError('');

    try {
      // Call API to start video generation
      const response = await api.generate.startGeneration(url);

      // Navigate to loading page with jobId
      navigate('/create/generating', {
        state: {
          jobId: response.data.jobId,
          url: url
        }
      });
    } catch (err) {
      console.error('Video generation error:', err.message);
      setIsGenerating(false);
      setIsValid(false);
      setError(err.message || 'Failed to start video generation. Please try again.');
    }
  };

  const exampleUrls = [
    { url: 'https://arxiv.org/abs/1706.03762', label: 'Attention is All You Need' },
    { url: 'https://openai.com/research/gpt-4', label: 'GPT-4 Research' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Learn.AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/dashboard" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/create" className="text-base font-medium text-primary-600 border-b-2 border-primary-600 pb-1">
                Create Video
              </Link>
              <Link to="/review" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Review Project
              </Link>
            </div>

            {user && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">{user.avatar}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            )}
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-primary-600 bg-primary-50 rounded-lg"
                >
                  Create Video
                </Link>
                <Link
                  to="/review"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Review Project
                </Link>
                {user && (
                  <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-600">{user.avatar}</span>
                      </div>
                      <span className="text-sm text-gray-700">{user.name || user.email}</span>
                    </div>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700
                        rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Video Generation
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Own Learning Video
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste any research paper or technical article URL and get a personalized
            5-10 minute educational video in minutes.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Article or Paper URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setIsValid(true);
                    setError('');
                  }}
                  className={`w-full px-4 py-4 pl-12 bg-white border-2 rounded-lg
                           focus:outline-none placeholder:text-gray-400 transition-all
                           ${isValid
                             ? 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20'
                             : 'border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-500 focus:ring-opacity-20'
                           }`}
                  placeholder="https://arxiv.org/abs/..."
                  required
                />
                <LinkIcon className={`absolute left-4 top-4 w-5 h-5 ${isValid ? 'text-gray-400' : 'text-error-600'}`} />
              </div>
              {!isValid && (
                <p className="text-sm text-error-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Supported sources: arXiv, research papers, technical blogs, educational articles
              </p>
            </div>

            {/* Examples */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Example URLs:
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                {exampleUrls.map((example, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <button
                      type="button"
                      onClick={() => setUrl(example.url)}
                      className="text-primary-600 hover:text-primary-700 hover:underline text-left"
                    >
                      {example.url} ({example.label})
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!url || isGenerating}
              className="w-full px-8 py-4 bg-primary-600 text-white rounded-lg font-medium text-lg
                       hover:bg-primary-700 active:bg-primary-800
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Video</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              2-5 Minutes
            </h3>
            <p className="text-sm text-gray-600">
              Average generation time
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              5-10 Minutes
            </h3>
            <p className="text-sm text-gray-600">
              Video length
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto-Saved
            </h3>
            <p className="text-sm text-gray-600">
              To your library
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-info-50 border border-info-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-info-900 mb-2">
                Tips for Best Results
              </h4>
              <ul className="text-sm text-info-700 space-y-1">
                <li>• Use publicly accessible URLs (no paywalls or login requirements)</li>
                <li>• Longer articles may take more time to process</li>
                <li>• Complex mathematical content will be simplified for clarity</li>
                <li>• You can generate up to 5 videos per day</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVideoPage;
