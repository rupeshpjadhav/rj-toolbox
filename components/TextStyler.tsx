
import React, { useState } from 'react';
import ToolCard from './ToolCard';

import { toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toCapitalizedCase } from '../lib/textCase';

const TextStyler: React.FC = () => {
  const [input, setInput] = useState<string>('hello world again');

  const conversions = {
    camelCase: toCamelCase(input),
    PascalCase: toPascalCase(input),
    snake_case: toSnakeCase(input),
    'kebab-case': toKebabCase(input),
    'Capitalized Case': toCapitalizedCase(input),
  };

  return (
    <ToolCard title="Text Styler" description="Convert text into various programming and stylistic case formats. Ideal for naming variables, functions, and files.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Input Text</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-sm focus:ring-2 focus:ring-cyan-500"
            placeholder="Type your text..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(conversions).map(([name, value]) => (
            <div key={name} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">{name}</label>
              <input
                type="text"
                value={value}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="w-full bg-slate-800 p-2 rounded-md font-mono text-cyan-300 text-sm cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </ToolCard>
  );
};

export default TextStyler;
