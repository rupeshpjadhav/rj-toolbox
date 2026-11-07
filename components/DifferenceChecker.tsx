
import React, { useState, useMemo } from 'react';
import ToolCard from './ToolCard';
import { diffLines, Change } from 'diff';

const DifferenceChecker: React.FC = () => {
  const [textA, setTextA] = useState<string>('This is the original text.\nIt has two lines.\nAnd a third one.');
  const [textB, setTextB] = useState<string>('This is the modified text.\nIt has a second line.\nAnd a third one.');

  const diffResult = useMemo(() => diffLines(textA, textB), [textA, textB]);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setter(e.target?.result as string);
      };
      reader.readAsText(file);
      event.target.value = ''; // Allow re-uploading the same file
    }
  };

  const renderDiff = (part: Change, index: number) => {
    const colorClass = part.added
      ? 'bg-green-900/50'
      : part.removed
      ? 'bg-red-900/50'
      : 'bg-transparent';
    const sign = part.added ? '+' : part.removed ? '-' : ' ';
    
    return (
      <div key={index} className={`flex ${colorClass}`}>
        <span className="w-8 text-center text-slate-500 select-none flex-shrink-0">{sign}</span>
        <pre className="whitespace-pre-wrap break-all flex-grow py-0.5">{part.value.replace(/\n$/, '')}</pre>
      </div>
    );
  };

  return (
    <ToolCard title="Difference Checker" description="Compare two blocks of text to see the differences. Added lines are green, removed lines are red.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-300">Original Text</label>
            <div>
                <label htmlFor="file-a" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold py-1 px-3 rounded-md transition-colors duration-200">
                    Upload File
                </label>
                <input id="file-a" type="file" className="hidden" onChange={handleFileChange(setTextA)} />
            </div>
          </div>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-300">Modified Text</label>
             <div>
                <label htmlFor="file-b" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold py-1 px-3 rounded-md transition-colors duration-200">
                    Upload File
                </label>
                <input id="file-b" type="file" className="hidden" onChange={handleFileChange(setTextB)} />
            </div>
          </div>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-xl font-bold text-white mb-3">Comparison Result</h3>
        <div className="bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono overflow-x-auto">
          {diffResult.map(renderDiff)}
        </div>
      </div>
    </ToolCard>
  );
};

export default DifferenceChecker;
