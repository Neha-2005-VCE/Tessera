import React, { useState, useEffect } from 'react';
import { Users, Search, TrendingUp, Award } from 'lucide-react';
import { skillsAPI } from '../services/api.js';

interface Skill {
  title: string;
  category: string;
  strength: number;
}

interface ComparisonUser {
  id: string;
  name: string;
  role: string;
  company?: string;
  skills: Skill[];
}

interface SkillsComparisonProps {
  userSkills: Skill[];
}

const SkillsComparison: React.FC<SkillsComparisonProps> = ({ userSkills }) => {
  const [selectedUser, setSelectedUser] = useState<ComparisonUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<ComparisonUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        const comparisonUsers = await skillsAPI.getComparisonData();
        setUsers(comparisonUsers);
        console.log('Comparison users fetched:', comparisonUsers);
      } catch (error) {
        console.error('Failed to fetch comparison data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateOverlap = (otherUserSkills: Skill[]) => {
    const userSkillTitles = new Set(userSkills.map(s => s.title));
    const otherSkillTitles = new Set(otherUserSkills.map(s => s.title));
    const intersection = new Set([...userSkillTitles].filter(x => otherSkillTitles.has(x)));
    const union = new Set([...userSkillTitles, ...otherSkillTitles]);
    
    return {
      percentage: Math.round((intersection.size / union.size) * 100),
      commonSkills: Array.from(intersection),
      totalCommon: intersection.size,
      totalUnique: union.size
    };
  };

  const getComparisonData = (otherUser: ComparisonUser) => {
    const overlap = calculateOverlap(otherUser.skills);
    const userSkillMap = new Map(userSkills.map(s => [s.title, s.strength]));
    const otherSkillMap = new Map(otherUser.skills.map(s => [s.title, s.strength]));
    
    const detailedComparison = overlap.commonSkills.map(skillTitle => ({
      title: skillTitle,
      userStrength: userSkillMap.get(skillTitle) || 0,
      otherStrength: otherSkillMap.get(skillTitle) || 0,
      category: userSkills.find(s => s.title === skillTitle)?.category || 
                otherUser.skills.find(s => s.title === skillTitle)?.category || 'Other'
    }));

    return { overlap, detailedComparison };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Loading Comparison Data
          </h3>
          <p className="text-slate-600">
            Finding professionals to compare your skills with...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Skills Comparison</h2>
        <p className="text-slate-600">Compare your skills with other professionals to discover growth opportunities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Search and Selection */}
        <div>
          <div className="mb-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search professionals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No professionals found for comparison</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const { overlap } = getComparisonData(user);
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedUser?.id === user.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-600">{user.role}</div>
                        {user.company && (
                          <div className="text-sm text-slate-500">{user.company}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{overlap.percentage}%</div>
                        <div className="text-xs text-slate-500">Overlap</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {overlap.totalCommon} skills in common
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Comparison Results */}
        <div>
          {selectedUser ? (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Comparison with {selectedUser.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span>{selectedUser.role}</span>
                  {selectedUser.company && (
                    <span>• {selectedUser.company}</span>
                  )}
                </div>
              </div>

              {(() => {
                const { overlap, detailedComparison } = getComparisonData(selectedUser);
                return (
                  <>
                    {/* Overview Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">{overlap.percentage}%</div>
                        <div className="text-blue-600 text-sm font-medium">Skills Overlap</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{overlap.totalCommon}</div>
                        <div className="text-green-600 text-sm font-medium">Common Skills</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-700">{overlap.totalUnique - overlap.totalCommon}</div>
                        <div className="text-orange-600 text-sm font-medium">Unique Skills</div>
                      </div>
                    </div>

                    {/* Detailed Comparison */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-blue-600" />
                        Skill-by-Skill Comparison
                      </h4>
                      {detailedComparison.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600">No common skills found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {detailedComparison.map((skill) => (
                            <div key={skill.title} className="bg-slate-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-slate-900">{skill.title}</span>
                                <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded">
                                  {skill.category}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">You</span>
                                    <span className="font-medium">{skill.userStrength}/10</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{ width: `${skill.userStrength * 10}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">{selectedUser.name.split(' ')[0]}</span>
                                    <span className="font-medium">{skill.otherStrength}/10</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${skill.otherStrength * 10}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Select a Professional to Compare
              </h3>
              <p className="text-slate-600">
                Choose someone from the list to see how your skills compare
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsComparison;

// import React, { useState } from 'react';
// import { Users, Search, TrendingUp, Award } from 'lucide-react';

// interface Skill {
//   title: string;
//   category: string;
//   strength: number;
// }

// interface ComparisonUser {
//   id: string;
//   name: string;
//   role: string;
//   company?: string;
//   skills: Skill[];
// }

// interface SkillsComparisonProps {
//   userSkills: Skill[];
// }

// const SkillsComparison: React.FC<SkillsComparisonProps> = ({ userSkills }) => {
//   const [selectedUser, setSelectedUser] = useState<ComparisonUser | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Mock data for other users
//   const mockUsers: ComparisonUser[] = [
//     {
//       id: '1',
//       name: 'Aditya K',
//       role: 'Senior Frontend Developer',
//       company: 'Apple',
//       skills: [
//         { title: 'React', category: 'Frontend', strength: 9 },
//         { title: 'JavaScript', category: 'Frontend', strength: 8 },
//         { title: 'TypeScript', category: 'Frontend', strength: 8 },
//         { title: 'Vue.js', category: 'Frontend', strength: 7 },
//         { title: 'Node.js', category: 'Backend', strength: 6 },
//         { title: 'GraphQL', category: 'Backend', strength: 7 }
//       ]
//     },
//     {
//       id: '2',
//       name: 'Anup P',
//       role: 'Full Stack Developer',
//       company: 'Google',
//       skills: [
//         { title: 'React', category: 'Frontend', strength: 7 },
//         { title: 'Node.js', category: 'Backend', strength: 9 },
//         { title: 'Python', category: 'Backend', strength: 8 },
//         { title: 'SQL', category: 'Backend', strength: 8 },
//         { title: 'Docker', category: 'Tools', strength: 7 },
//         { title: 'AWS', category: 'Tools', strength: 8 }
//       ]
//     },
//     {
//       id: '3',
//       name: 'Kiran AB',
//       role: 'Backend Engineer',
//       company: 'Cisco',
//       skills: [
//         { title: 'Python', category: 'Backend', strength: 9 },
//         { title: 'Java', category: 'Backend', strength: 8 },
//         { title: 'SQL', category: 'Backend', strength: 9 },
//         { title: 'Docker', category: 'Tools', strength: 8 },
//         { title: 'Kubernetes', category: 'Tools', strength: 7 },
//         { title: 'AWS', category: 'Tools', strength: 9 }
//       ]
//     }
//   ];

//   const filteredUsers = mockUsers.filter(user => 
//     user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.company?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const calculateOverlap = (otherUserSkills: Skill[]) => {
//     const userSkillTitles = new Set(userSkills.map(s => s.title));
//     const otherSkillTitles = new Set(otherUserSkills.map(s => s.title));
//     const intersection = new Set([...userSkillTitles].filter(x => otherSkillTitles.has(x)));
//     const union = new Set([...userSkillTitles, ...otherSkillTitles]);
    
//     return {
//       percentage: Math.round((intersection.size / union.size) * 100),
//       commonSkills: Array.from(intersection),
//       totalCommon: intersection.size,
//       totalUnique: union.size
//     };
//   };

//   const getComparisonData = (otherUser: ComparisonUser) => {
//     const overlap = calculateOverlap(otherUser.skills);
//     const userSkillMap = new Map(userSkills.map(s => [s.title, s.strength]));
//     const otherSkillMap = new Map(otherUser.skills.map(s => [s.title, s.strength]));
    
//     const detailedComparison = overlap.commonSkills.map(skillTitle => ({
//       title: skillTitle,
//       userStrength: userSkillMap.get(skillTitle) || 0,
//       otherStrength: otherSkillMap.get(skillTitle) || 0,
//       category: userSkills.find(s => s.title === skillTitle)?.category || 
//                 otherUser.skills.find(s => s.title === skillTitle)?.category || 'Other'
//     }));

//     return { overlap, detailedComparison };
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm p-8">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-slate-900 mb-2">Skills Comparison</h2>
//         <p className="text-slate-600">Compare your skills with other professionals to discover growth opportunities</p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* User Search and Selection */}
//         <div>
//           <div className="mb-4">
//             <div className="relative">
//               <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Search professionals..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//             </div>
//           </div>

//           <div className="space-y-3 max-h-96 overflow-y-auto">
//             {filteredUsers.map((user) => {
//               const { overlap } = getComparisonData(user);
//               return (
//                 <button
//                   key={user.id}
//                   onClick={() => setSelectedUser(user)}
//                   className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
//                     selectedUser?.id === user.id
//                       ? 'border-blue-500 bg-blue-50'
//                       : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
//                   }`}
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <div>
//                       <div className="font-semibold text-slate-900">{user.name}</div>
//                       <div className="text-sm text-slate-600">{user.role}</div>
//                       {user.company && (
//                         <div className="text-sm text-slate-500">{user.company}</div>
//                       )}
//                     </div>
//                     <div className="text-right">
//                       <div className="text-lg font-bold text-blue-600">{overlap.percentage}%</div>
//                       <div className="text-xs text-slate-500">Overlap</div>
//                     </div>
//                   </div>
//                   <div className="text-sm text-slate-600">
//                     {overlap.totalCommon} skills in common
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Comparison Results */}
//         <div>
//           {selectedUser ? (
//             <div>
//               <div className="mb-6">
//                 <h3 className="text-xl font-semibold text-slate-900 mb-2">
//                   Comparison with {selectedUser.name}
//                 </h3>
//                 <div className="flex items-center space-x-4 text-sm text-slate-600">
//                   <span>{selectedUser.role}</span>
//                   {selectedUser.company && (
//                     <span>• {selectedUser.company}</span>
//                   )}
//                 </div>
//               </div>

//               {(() => {
//                 const { overlap, detailedComparison } = getComparisonData(selectedUser);
//                 return (
//                   <>
//                     {/* Overview Stats */}
//                     <div className="grid grid-cols-3 gap-4 mb-6">
//                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
//                         <div className="text-2xl font-bold text-blue-700">{overlap.percentage}%</div>
//                         <div className="text-blue-600 text-sm font-medium">Skills Overlap</div>
//                       </div>
//                       <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
//                         <div className="text-2xl font-bold text-green-700">{overlap.totalCommon}</div>
//                         <div className="text-green-600 text-sm font-medium">Common Skills</div>
//                       </div>
//                       <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
//                         <div className="text-2xl font-bold text-orange-700">{overlap.totalUnique - overlap.totalCommon}</div>
//                         <div className="text-orange-600 text-sm font-medium">Unique Skills</div>
//                       </div>
//                     </div>

//                     {/* Detailed Comparison */}
//                     <div>
//                       <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
//                         <Award className="w-5 h-5 mr-2 text-blue-600" />
//                         Skill-by-Skill Comparison
//                       </h4>
//                       <div className="space-y-3">
//                         {detailedComparison.map((skill) => (
//                           <div key={skill.title} className="bg-slate-50 rounded-lg p-4">
//                             <div className="flex justify-between items-center mb-2">
//                               <span className="font-medium text-slate-900">{skill.title}</span>
//                               <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded">
//                                 {skill.category}
//                               </span>
//                             </div>
//                             <div className="grid grid-cols-2 gap-4">
//                               <div>
//                                 <div className="flex justify-between text-sm mb-1">
//                                   <span className="text-slate-600">You</span>
//                                   <span className="font-medium">{skill.userStrength}/10</span>
//                                 </div>
//                                 <div className="w-full bg-slate-200 rounded-full h-2">
//                                   <div 
//                                     className="bg-blue-500 h-2 rounded-full"
//                                     style={{ width: `${skill.userStrength * 10}%` }}
//                                   ></div>
//                                 </div>
//                               </div>
//                               <div>
//                                 <div className="flex justify-between text-sm mb-1">
//                                   <span className="text-slate-600">{selectedUser.name.split(' ')[0]}</span>
//                                   <span className="font-medium">{skill.otherStrength}/10</span>
//                                 </div>
//                                 <div className="w-full bg-slate-200 rounded-full h-2">
//                                   <div 
//                                     className="bg-green-500 h-2 rounded-full"
//                                     style={{ width: `${skill.otherStrength * 10}%` }}
//                                   ></div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </>
//                 );
//               })()}
//             </div>
//           ) : (
//             <div className="text-center py-12">
//               <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-slate-900 mb-2">
//                 Select a Professional to Compare
//               </h3>
//               <p className="text-slate-600">
//                 Choose someone from the list to see how your skills compare
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SkillsComparison;