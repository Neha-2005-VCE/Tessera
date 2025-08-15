import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, MapPin, ChevronRight, Lightbulb, Star } from 'lucide-react';
import { usersAPI } from '../services/api.js';

interface Skill {
  title: string;
  category: string;
  strength: number;
}

interface CareerPath {
  title: string;
  description: string;
  nextSkills: string[];
  growthPath: string;
  matchPercentage: number;
  salaryRange: string;
  demandLevel: 'High' | 'Medium' | 'Low';
}

interface CareerRecommendationsProps {
  userSkills: Skill[];
}

const CareerRecommendations: React.FC<CareerRecommendationsProps> = ({ userSkills }) => {
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCareerRecommendations = async () => {
      setIsLoading(true);
      
      try {
        const recommendations = await usersAPI.getCareerRecommendations();
        setCareerPaths(recommendations);
      } catch (error) {
        console.error('Failed to fetch career recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCareerRecommendations();
  }, [userSkills]);

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Analyzing Career Opportunities
          </h3>
          <p className="text-slate-600">
            Our AI is finding the perfect career paths based on your skills...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Career Recommendations</h2>
        <p className="text-slate-600">Discover career paths tailored to your skills and potential growth opportunities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Career Paths List */}
        <div>
          <div className="space-y-4">
            {careerPaths.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No career recommendations available</p>
              </div>
            ) : (
              careerPaths.map((path, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPath(path)}
                  className={`w-full text-left p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedPath?.title === path.title
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{path.title}</h3>
                      <p className="text-sm text-slate-600 mb-2">{path.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-xl font-bold ${getMatchColor(path.matchPercentage)}`}>
                        {path.matchPercentage}%
                      </div>
                      <div className="text-xs text-slate-500">Match</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-slate-700">{path.salaryRange}</span>
                      <span className={`text-xs px-2 py-1 rounded border ${getDemandColor(path.demandLevel)}`}>
                        {path.demandLevel} Demand
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detailed Career Path View */}
        <div>
          {selectedPath ? (
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{selectedPath.title}</h3>
                <p className="text-slate-600 leading-relaxed">{selectedPath.description}</p>
              </div>

              {/* Match Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-700">Skills Match</span>
                  <span className={`font-bold ${getMatchColor(selectedPath.matchPercentage)}`}>
                    {selectedPath.matchPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      selectedPath.matchPercentage >= 80 ? 'bg-green-500' :
                      selectedPath.matchPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${selectedPath.matchPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Salary and Demand */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">Salary Range</div>
                  <div className="font-semibold text-slate-900">{selectedPath.salaryRange}</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">Market Demand</div>
                  <div className={`font-semibold ${
                    selectedPath.demandLevel === 'High' ? 'text-green-600' :
                    selectedPath.demandLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedPath.demandLevel}
                  </div>
                </div>
              </div>

              {/* Skills to Develop */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPath.nextSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Growth Path */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Career Growth Path
                </h4>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {selectedPath.growthPath}
                  </div>
                </div>
              </div>

  
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Select a Career Path
              </h3>
              <p className="text-slate-600">
                Choose a career recommendation to see detailed information and growth opportunities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-blue-600" />
          Career Development Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Focus on developing skills with the highest demand in your target role</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Consider building a portfolio that showcases your new skills</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Network with professionals in your target career path</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Stay updated with industry trends and emerging technologies</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerRecommendations;