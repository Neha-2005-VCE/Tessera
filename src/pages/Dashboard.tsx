import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Upload, 
  FileText, 
  TreePine, 
  List, 
  Users, 
  TrendingUp,
  LogOut,
  User,
  Zap,
  Target,
  AlertCircle
} from 'lucide-react';
import SkillsVisualization from '../components/SkillsVisualization';
import SkillsComparison from '../components/SkillsComparison';
import CareerRecommendations from '../components/CareerRecommendations';
import { skillsAPI } from '../services/api.js';

type ViewMode = 'upload' | 'skills' | 'compare' | 'career';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentView, setCurrentView] = useState<ViewMode>('upload');
  const [skills, setSkills] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Load existing skills on component mount
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const skillsData = await skillsAPI.getSkills();
        if (skillsData.list && skillsData.list.length > 0) {
          setSkills(skillsData);
          setCurrentView('skills');
        }
      } catch (error) {
        console.error('Failed to load skills:', error);
      }
    };

    loadSkills();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const skillsData = await skillsAPI.uploadFile(formData);
      setSkills(skillsData);
      setCurrentView('skills');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const navigationItems = [
    { id: 'upload', label: 'Upload Files', icon: <Upload className="w-5 h-5" />, disabled: false },
    { id: 'skills', label: 'My Skills', icon: <TreePine className="w-5 h-5" />, disabled: !skills },
    { id: 'compare', label: 'Compare Skills', icon: <Users className="w-5 h-5" />, disabled: !skills },
    { id: 'career', label: 'Career Paths', icon: <Target className="w-5 h-5" />, disabled: !skills }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-slate-800">Tessera</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <User className="w-5 h-5" />
                <span className="font-medium">{user?.name}</span>
                <span className="text-sm bg-slate-100 px-2 py-1 rounded capitalize">
                  {user?.type}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-xl shadow-sm p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setCurrentView(item.id as ViewMode)}
                    disabled={item.disabled}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      currentView === item.id
                        ? 'bg-blue-600 text-white'
                        : item.disabled
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Profile Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-600">Name:</span>
                  <div className="font-medium text-slate-900">{user?.name}</div>
                </div>
                <div>
                  <span className="text-slate-600">Email:</span>
                  <div className="font-medium text-slate-900">{user?.email}</div>
                </div>
                {user?.type === 'student' ? (
                  <>
                    <div>
                      <span className="text-slate-600">Institute:</span>
                      <div className="font-medium text-slate-900">{user.institute}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Graduation:</span>
                      <div className="font-medium text-slate-900">{user.graduationYear}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-600">Company:</span>
                      <div className="font-medium text-slate-900">{user?.company}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Role:</span>
                      <div className="font-medium text-slate-900">{user?.role}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {currentView === 'upload' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    Upload Your Documents
                  </h2>
                  <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                    Upload your resume, portfolio, or any professional documents. 
                    Our AI will analyze them to extract and visualize your skills.
                  </p>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center space-x-2 max-w-md mx-auto">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <span className="text-red-700 text-sm">{error}</span>
                    </div>
                  )}
                  
                  <div className="max-w-md mx-auto">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-2"
                    >
                      {isUploading ? (
                        <>
                          <Zap className="w-5 h-5 animate-pulse" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Choose File</span>
                        </>
                      )}
                    </button>
                    
                    <p className="text-sm text-slate-500 mt-4">
                      Supported formats: PDF, DOC, DOCX, TXT, MP4, MP3.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'skills' && skills && (
              <SkillsVisualization skills={skills} />
            )}

            {currentView === 'compare' && skills && (
              <SkillsComparison userSkills={skills.list} />
            )}

            {currentView === 'career' && skills && (
              <CareerRecommendations userSkills={skills.list} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;