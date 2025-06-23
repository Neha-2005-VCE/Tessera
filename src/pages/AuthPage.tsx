import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, User, GraduationCap, Briefcase, ArrowLeft, AlertCircle } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type UserType = 'student' | 'professional';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    institute: '',
    graduationYear: '',
    company: '',
    role: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (authMode === 'login') {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          userType,
          ...(userType === 'student' ? {
            institute: formData.institute,
            graduationYear: parseInt(formData.graduationYear) || null
          } : {
            company: formData.company,
            role: formData.role
          })
        };

        await register(userData);
      }
      
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-800">Tessera</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Join Tessera'}
              </h2>
              <p className="text-slate-600">
                {authMode === 'login' 
                  ? 'Sign in to your account to continue' 
                  : 'Create your account to get started'
                }
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Auth Mode Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  authMode === 'signup'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* User Type Selection (for signup) */}
            {authMode === 'signup' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('student')}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                      userType === 'student'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <GraduationCap className="w-8 h-8 mb-2" />
                    <span className="font-medium">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('professional')}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                      userType === 'professional'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Briefcase className="w-8 h-8 mb-2" />
                    <span className="font-medium">Professional</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>

              {/* Conditional Fields for Signup */}
              {authMode === 'signup' && userType === 'student' && (
                <>
                  <div>
                    <label htmlFor="institute" className="block text-sm font-medium text-slate-700 mb-2">
                      Institute Name
                    </label>
                    <input
                      id="institute"
                      name="institute"
                      type="text"
                      required
                      value={formData.institute}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your institute name"
                    />
                  </div>
                  <div>
                    <label htmlFor="graduationYear" className="block text-sm font-medium text-slate-700 mb-2">
                      Graduation Year
                    </label>
                    <select
                      id="graduationYear"
                      name="graduationYear"
                      required
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select graduation year</option>
                      {Array.from({ length: 10 }, (_, i) => 2024 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {authMode === 'signup' && userType === 'professional' && (
                <>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                      Company
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your company name"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                      Role
                    </label>
                    <input
                      id="role"
                      name="role"
                      type="text"
                      required
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your job title"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
              >
                {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-slate-600">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;