import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Download, ArrowLeft, CheckCircle, AlertTriangle, Star, TrendingUp, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ReviewResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const reviewId = location.state?.reviewId;
  const repoUrl = location.state?.repoUrl || '';

  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState(0);
  const [reviewData, setReviewData] = useState(null);
  const [error, setError] = useState('');

  // Poll for status while processing
  useEffect(() => {
    if (!reviewId) {
      setError('No review ID provided. Please submit a repository for review.');
      setStatus('error');
      return;
    }

    let pollInterval;
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const response = await api.reviews.checkStatus(reviewId);

        if (!isMounted) return;

        // Backend returns { success, data: { status, progress: { step, message } } }
        const statusData = response.data;
        const jobStatus = statusData.status;

        // Calculate progress percentage from step (1-3)
        const progressStep = statusData.progress?.step || 1;
        const jobProgress = Math.round((progressStep / 3) * 100);
        setProgress(jobProgress);

        if (jobStatus === 'completed') {
          // Fetch full results
          const resultsResponse = await api.reviews.getResults(reviewId);
          if (isMounted) {
            // Backend returns data directly (not nested under 'review')
            // Convert camelCase to snake_case for frontend consistency
            const data = resultsResponse.data;
            setReviewData({
              repo_name: data.repoName,
              quality_score: data.qualityScore,
              key_suggestions: data.keySuggestions || [],
              strengths: data.strengths || [],
              improvements: data.improvements || [],
              full_review: data.fullReview,
              completed_at: data.completedAt
            });
            setStatus('completed');
          }
          clearInterval(pollInterval);
        } else if (jobStatus === 'failed') {
          setError(statusData.progress?.message || 'Review failed. Please try again.');
          setStatus('error');
          clearInterval(pollInterval);
        } else {
          setStatus('processing');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to check review status');
          setStatus('error');
        }
        clearInterval(pollInterval);
      }
    };

    // Initial check
    pollStatus();

    // Poll every 3 seconds
    pollInterval = setInterval(pollStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [reviewId]);

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-success-600 bg-success-50 border-success-200';
    if (score >= 6) return 'text-warning-600 bg-warning-50 border-warning-200';
    return 'text-error-600 bg-error-50 border-error-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.reviews.downloadPDF(reviewId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code-review-${reviewData?.repo_name?.replace('/', '-') || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('PDF download is not yet available. This feature will be implemented soon.');
    }
  };

  const repoName = reviewData?.repo_name || repoUrl.split('/').slice(-2).join('/') || 'your-repo';

  // Loading state
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">LearnAI</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Loading Content */}
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Analyzing Your Repository
            </h1>
            <p className="text-gray-600 mb-6">
              We're reviewing your code with AI. This usually takes 2-5 minutes.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Repository: {repoName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">LearnAI</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Error Content */}
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="bg-white rounded-2xl border border-error-200 p-12">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Review Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => navigate('/review')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                       hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">LearnAI</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/dashboard" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/create" className="text-base font-medium text-gray-700 hover:text-primary-600 transition-colors">
                Create Video
              </Link>
              <Link to="/review" className="text-base font-medium text-primary-600 border-b-2 border-primary-600 pb-1">
                Review Project
              </Link>
            </div>

            {user && (
              <div className="flex items-center gap-2">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/review')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Review</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Code Review Results
              </h1>
              <p className="text-gray-600">{repoName}</p>
              <p className="text-sm text-gray-500 mt-1">
                Reviewed on {reviewData?.completed_at
                  ? new Date(reviewData.completed_at).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                       hover:bg-primary-700 transition-colors
                       flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>

          {/* Quality Score */}
          <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl border-2 ${getScoreColor(reviewData?.quality_score || 0)}`}>
            <Star className="w-8 h-8" />
            <div>
              <div className="text-3xl font-bold">{reviewData?.quality_score || 0}/10</div>
              <div className="text-sm font-medium">{getScoreLabel(reviewData?.quality_score || 0)}</div>
            </div>
          </div>
        </div>

        {/* Key Suggestions */}
        {reviewData?.key_suggestions && reviewData.key_suggestions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Key Suggestions
              </h2>
            </div>
            <ul className="space-y-3">
              {reviewData.key_suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-sm font-semibold text-primary-600">{idx + 1}</span>
                  </div>
                  <p className="text-gray-700">{suggestion}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths and Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          {reviewData?.strengths && reviewData.strengths.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-success-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Strengths
                </h3>
              </div>
              <ul className="space-y-3">
                {reviewData.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{strength}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {reviewData?.improvements && reviewData.improvements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-warning-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Areas for Improvement
                </h3>
              </div>
              <ul className="space-y-3">
                {reviewData.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{improvement}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Full Review */}
        {reviewData?.full_review && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Detailed Review
              </h2>
            </div>
            <div className="prose prose-gray max-w-none">
              {reviewData.full_review.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => navigate('/review')}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium
                     hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Review Another Project
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                     hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewResultsPage;
