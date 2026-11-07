
import React from 'react';

interface ToolCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, children }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-2xl p-6 sm:p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default ToolCard;
