import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  FileText, 
  Zap, 
  Target,
  ChevronRight,
  Star,
  CheckCircle
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Skills Analysis",
      description: "Upload your documents and let our AI extract and analyze your skills with precision"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Visual Skills Mapping",
      description: "See your skills in beautiful tree and list formats with strength indicators"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Skills Comparison",
      description: "Compare your skill set with peers and discover areas for growth"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Career Path Recommendations",
      description: "Get personalized career suggestions based on your current skills"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "TechCorp",
      quote: "Tessera helped me visualize my skills gap and land my dream job!",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Computer Science Student",
      university: "MIT",
      quote: "The career recommendations were spot-on. I now have a clear roadmap.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-800">Tessera</span>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Visualize Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Skills</span>
              <br />
              Shape Your Future
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your documents into powerful skill profiles with AI. Compare with peers, 
              discover growth opportunities, and get personalized career recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
              >
                Start Your Journey
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <button className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-white">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-indigo-200 rounded-full opacity-60 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Powerful Features for Modern Professionals
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to understand, visualize, and grow your professional skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How Tessera Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Three simple steps to unlock your professional potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Upload Documents</h3>
                <p className="text-slate-600">Upload your resume, portfolio, or any relevant documents</p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-3">AI Analysis</h3>
                <p className="text-slate-600">Our AI extracts and analyzes your skills with strength ratings</p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Visualize & Grow</h3>
                <p className="text-slate-600">View your skills, compare with others, and get career recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Unlock Your Potential?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of professionals and students who are already using Tessera 
            to visualize their skills and accelerate their careers.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center"
          >
            Get Started Free
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">Tessera</span>
            </div>
            <div className="text-slate-400">
              © 2024 Tessera. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;