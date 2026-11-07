import React, { useState } from 'react';
import { copyText } from '../lib/clipboard';
import ToolCard from './ToolCard';
import { format } from 'sql-formatter';
import { minifySql } from '../lib/sqlMinify';
import { Copy, CheckCheck, ArrowRightLeft, ClearIcon } from './Icons';

type Dialect = 'sql' | 'mysql' | 'postgresql' | 'transactsql';
type KeywordCase = 'upper' | 'lower';

const SqlFormatter: React.FC = () => {
  const [inputQuery, setInputQuery] = useState<string>('SELECT id, name FROM users WHERE status = \'active\' AND age > 25 ORDER BY name ASC;');
  const [outputQuery, setOutputQuery] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  
  // Formatting Options
  const [dialect, setDialect] = useState<Dialect>('sql');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');
  const [indent, setIndent] = useState<number>(2);

  const processQuery = (minify = false) => {
    if (!inputQuery.trim()) {
      setError('Input query is empty.');
      return;
    }
    setError('');
    setOutputQuery('');
    try {
      let result = format(inputQuery, {
        language: dialect,
        keywordCase: keywordCase,
        tabWidth: indent,
      });

      // Collapse to one line without changing string literals or breaking -- comments.
      if (minify) {
        result = minifySql(result);
      }

      setOutputQuery(result);
    } catch (e) {
      setError(e instanceof Error ? `Invalid SQL: ${e.message}` : 'Failed to format query.');
    }
  };

  const handleCopy = () => {
    if (!outputQuery) return;
    copyText(outputQuery).then((ok) => {
            if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSwap = () => {
    if (!outputQuery) return;
    setInputQuery(outputQuery);
    setOutputQuery('');
  };
  
  const handleClear = () => {
    setInputQuery('');
    setOutputQuery('');
    setError('');
  };

  return (
    <ToolCard title="SQL Formatter & Validator" description="Beautify, minify, and validate your SQL queries with various formatting options. Errors in syntax will be highlighted.">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Input SQL</label>
          <textarea
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500"
            placeholder="-- Your SQL query here"
          />
        </div>

        <div className="my-4 md:my-0 flex justify-center">
          <button onClick={handleSwap} disabled={!outputQuery} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Swap Input and Output">
            <ArrowRightLeft />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Output SQL</label>
          <div className="relative">
            <textarea
              value={outputQuery}
              readOnly
              className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono"
              placeholder="-- Formatted SQL appears here"
            />
            {outputQuery && (
              <button onClick={handleCopy} className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors duration-200 z-10" title="Copy to clipboard">
                {copied ? <CheckCheck /> : <Copy />}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm font-mono">{error}</div>}
      
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
        <div>
          <label className="text-sm font-medium text-slate-400 mr-2">Dialect:</label>
          <select value={dialect} onChange={e => setDialect(e.target.value as Dialect)} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500">
            <option value="sql">Standard SQL</option>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="transactsql">Transact-SQL (T-SQL)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-400 mr-2">Keyword Case:</label>
          <select value={keywordCase} onChange={e => setKeywordCase(e.target.value as KeywordCase)} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500">
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-400 mr-2">Indentation:</label>
          <select value={indent} onChange={e => setIndent(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500">
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button onClick={() => processQuery(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
          Format
        </button>
        <button onClick={() => processQuery(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
          Minify
        </button>
        <button onClick={handleClear} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2">
          <ClearIcon /> Clear
        </button>
      </div>
    </ToolCard>
  );
};

export default SqlFormatter;