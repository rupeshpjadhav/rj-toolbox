import React, { useState } from 'react';
import { copyText } from '../lib/clipboard';
import ToolCard from './ToolCard';
import { Copy, CheckCheck } from './Icons';

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

const CaseConverter: React.FC = () => {
  const [input, setInput] = useState<string>('hello world, this is a test.');
  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    if (!output) return;
    copyText(output).then((ok) => {
            if (!ok) return;
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  return (
    <ToolCard title="Case Converter" description="Quickly convert your text into different standard cases. The result appears in the output box below.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Input Text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm focus:ring-2 focus:ring-cyan-500"
            placeholder="Type or paste your text here..."
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setOutput(input.toLowerCase())} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">lowercase</button>
          <button onClick={() => setOutput(input.toUpperCase())} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">UPPERCASE</button>
          <button onClick={() => setOutput(toTitleCase(input))} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">Title Case</button>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Output Text</label>
          <div className="relative">
            <textarea
              value={output}
              readOnly
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono"
              placeholder="Result will be shown here..."
            />
            {output && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors duration-200 z-10"
                title="Copy to clipboard"
              >
                {copied ? <CheckCheck /> : <Copy />}
              </button>
            )}
          </div>
        </div>
      </div>
    </ToolCard>
  );
};

export default CaseConverter;