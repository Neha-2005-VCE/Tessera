import React, { useState } from 'react';
import { TreePine, List, BarChart3, ZoomIn, ZoomOut } from 'lucide-react';

interface Skill {
  title: string;
  strength: number;
  children?: Skill[];
}

interface SkillsList {
  title: string;
  category: string;
  strength: number;
}

interface SkillsVisualizationProps {
  skills: {
    tree: Skill;
    list: SkillsList[];
  };
}

type ViewType = 'tree' | 'list';

const SkillsVisualization: React.FC<SkillsVisualizationProps> = ({ skills }) => {
  const [viewType, setViewType] = useState<ViewType>('tree');
  const [zoomLevel, setZoomLevel] = useState(1);

  const getStrengthColor = (strength: number) => {
    if (strength >= 8) return 'bg-green-500';
    if (strength >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStrengthBg = (strength: number) => {
    if (strength >= 8) return 'bg-green-50 border-green-200';
    if (strength >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const renderTreeNode = (node: Skill): JSX.Element => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.title} className="flex flex-col items-center">
        {/* Node box */}
        <div className="relative flex flex-col items-center">
          <div className={`border-2 rounded-lg p-4 min-w-[200px] text-center ${getStrengthBg(node.strength)}`}>
            <div className="font-semibold text-slate-900">{node.title}</div>
            <div className="text-sm text-slate-600">Strength: {node.strength}/10</div>
          </div>
          {hasChildren && <div className="w-px h-4 bg-slate-400"></div>}
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="flex mt-2 space-x-4 relative">
            <div className="absolute top-1.5 left-0 right-0 h-px bg-slate-400 z-0" />
            {node.children!.map(child => (
              <div className="relative z-10 flex flex-col items-center" key={child.title}>
                <div className="w-px h-4 bg-slate-400"></div>
                {renderTreeNode(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    const groupedSkills = skills.list.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, SkillsList[]>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorySkills.map((skill) => (
                <div key={skill.title} className={`border-2 rounded-lg p-4 ${getStrengthBg(skill.strength)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{skill.title}</span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-3 h-3 rounded-full ${getStrengthColor(skill.strength)}`}></div>
                      <span className="font-bold text-slate-900">{skill.strength}/10</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStrengthColor(skill.strength)}`}
                      style={{ width: `${skill.strength * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Skills Profile</h2>
          <p className="text-slate-600">Visualize your skills in different formats</p>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1 mt-4 sm:mt-0">
          <button
            onClick={() => setViewType('tree')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${viewType === 'tree'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <TreePine className="w-4 h-4" />
            <span>Tree View</span>
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${viewType === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <List className="w-4 h-4" />
            <span>List View</span>
          </button>
        </div>
      </div>

      <div className="mt-8">
       {viewType === 'tree' ? (
 <>
  {/* Zoom Controls */}
  <div className="flex justify-end mb-4 gap-2">
    <button
      onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}
      className="p-2 rounded-md bg-slate-100 hover:bg-slate-200"
    >
      <ZoomOut className="w-4 h-4" />
    </button>
    <button
      onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}
      className="p-2 rounded-md bg-slate-100 hover:bg-slate-200"
    >
      <ZoomIn className="w-4 h-4" />
    </button>
  </div>

  {/* ✅ Fixed size box with scrollable content */}
  <div className="w-[800px] h-[500px] overflow-auto border border-slate-200 rounded-xl bg-slate-50 p-4">
    <div
      className="w-max"
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top left',
      }}
    >
      {renderTreeNode(skills.tree)}
    </div>
  </div>
</>

) : renderListView()}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-700">
            {skills.list.filter(s => s.strength >= 8).length}
          </div>
          <div className="text-green-600 font-medium">Expert Skills</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {skills.list.filter(s => s.strength >= 6 && s.strength < 8).length}
          </div>
          <div className="text-yellow-600 font-medium">Intermediate Skills</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-red-700">
            {skills.list.filter(s => s.strength < 6).length}
          </div>
          <div className="text-red-600 font-medium">Beginner Skills</div>
        </div>
      </div>
    </div>
  );
};

export default SkillsVisualization;
