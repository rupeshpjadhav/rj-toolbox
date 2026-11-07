import React, { useState } from 'react';
import { minify } from 'terser';
import { Copy, CheckCheck } from 'lucide-react';
import ToolCard from './ToolCard';
import { checkJsSyntax, findEmptyBlockLines } from '../lib/jsSyntax';
import { copyText } from '../lib/clipboard';

type Mode = 'compress' | 'validate';

interface CompressionStats {
    originalSize: number;
    compressedSize: number;
    savings: number;
}

interface ValidationResult {
    line: number;
    column: number;
    severity: 'error' | 'warning';
    message: string;
    ruleId: string | null;
}

const JavaScriptToolkit: React.FC = () => {
    const [mode, setMode] = useState<Mode>('compress');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [stats, setStats] = useState<CompressionStats | null>(null);
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [options, setOptions] = useState({
        mangle: true,
        compress: true,
    });

    const calculateStats = (original: string, compressed: string): CompressionStats => {
        const originalSize = new Blob([original]).size;
        const compressedSize = new Blob([compressed]).size;
        const savings = ((originalSize - compressedSize) / originalSize) * 100;
        return {
            originalSize,
            compressedSize,
            savings
        };
    };

    const validateCode = async (code: string) => {
        try {
            // Parse with terser (never executes the code) to get the real line and column.
            const syntax = await checkJsSyntax(code);
            if (syntax) {
                setValidationResults([{
                    line: syntax.line,
                    column: syntax.column,
                    severity: 'error',
                    message: syntax.message,
                    ruleId: 'syntax-error'
                }]);
                setError('');
                return;
            }

            const validationResults: ValidationResult[] = [];
            
            // Basic syntax checks
            if (code.includes('debugger')) {
                validationResults.push({
                    line: code.split('\n').findIndex(line => line.includes('debugger')) + 1,
                    column: 1,
                    severity: 'warning',
                    message: 'Debugger statement detected',
                    ruleId: 'no-debugger'
                });
            }

            if (code.includes('console.log')) {
                validationResults.push({
                    line: code.split('\n').findIndex(line => line.includes('console.log')) + 1,
                    column: 1,
                    severity: 'warning',
                    message: 'Console statement detected',
                    ruleId: 'no-console'
                });
            }

            // Check for empty blocks (one entry per line)
            for (const line of findEmptyBlockLines(code)) {
                validationResults.push({
                    line,
                    column: 1,
                    severity: 'warning',
                    message: 'Empty block statement',
                    ruleId: 'no-empty'
                });
            }

            setValidationResults(validationResults);
            setError('');
        } catch (e) {
            if (e instanceof Error) {
                const errorMessage = e.message;
                const match = errorMessage.match(/at line (\d+)/);
                const line = match ? parseInt(match[1]) : 1;
                
                setValidationResults([{
                    line,
                    column: 1,
                    severity: 'error',
                    message: errorMessage,
                    ruleId: 'syntax-error'
                }]);
            } else {
                setError('Invalid JavaScript code');
                setValidationResults([]);
            }
        }
    };

    const handleProcess = async () => {
        if (!input.trim()) {
            setError('Please enter some JavaScript code');
            setOutput('');
            setStats(null);
            setValidationResults([]);
            return;
        }

        setProcessing(true);
        setError('');
        
        try {
            if (mode === 'compress') {
                const result = await minify(input, {
                    sourceMap: false,
                    mangle: options.mangle,
                    compress: options.compress ? {
                        dead_code: true,
                        drop_console: false,
                        drop_debugger: true,
                        keep_fnames: false,
                        keep_classnames: false,
                        passes: 2
                    } : false
                });

                if (result.code) {
                    setOutput(result.code);
                    setStats(calculateStats(input, result.code));
                } else {
                    throw new Error('Compression failed');
                }
                setValidationResults([]);
            } else {
                await validateCode(input);
                setOutput('');
                setStats(null);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : `Invalid JavaScript code`);
            setOutput('');
            setStats(null);
            setValidationResults([]);
        } finally {
            setProcessing(false);
        }
    };

    const handleCopy = () => {
        if (!output) return;
        copyText(output).then((ok) => {
            if (!ok) return;
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
        setError('');
        setStats(null);
        setValidationResults([]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setInput(content);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mode === 'compress' ? 'compressed.js' : 'validated.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getSeverityColor = (severity: 'error' | 'warning') => {
        return severity === 'error' 
            ? 'bg-red-900/50 border-red-700 text-red-300'
            : 'bg-yellow-900/50 border-yellow-700 text-yellow-300';
    };

    return (
        <ToolCard 
            title="JavaScript Toolkit" 
            description="Comprehensive JavaScript tools: compress/minify JavaScript code and validate it for errors and potential issues."
        >
            <div className="space-y-6">
                {/* Mode Selection */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setMode('compress')}
                        className={`px-4 py-2 rounded-md ${
                            mode === 'compress'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                    >
                        Compress
                    </button>
                    <button
                        onClick={() => setMode('validate')}
                        className={`px-4 py-2 rounded-md ${
                            mode === 'validate'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                    >
                        Validate
                    </button>
                </div>

                {/* Options */}
                <div className="flex flex-wrap gap-4">
                    {mode === 'compress' ? (
                        <>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={options.mangle}
                                    onChange={(e) => setOptions(prev => ({ ...prev, mangle: e.target.checked }))}
                                    className="form-checkbox h-4 w-4 text-cyan-500 rounded border-slate-600 bg-slate-700 focus:ring-cyan-500"
                                />
                                <span className="text-sm text-slate-300">Mangle variable names</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={options.compress}
                                    onChange={(e) => setOptions(prev => ({ ...prev, compress: e.target.checked }))}
                                    className="form-checkbox h-4 w-4 text-cyan-500 rounded border-slate-600 bg-slate-700 focus:ring-cyan-500"
                                />
                                <span className="text-sm text-slate-300">Apply compression</span>
                            </label>
                        </>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-slate-300">Input JavaScript</label>
                            <div>
                                <input
                                    type="file"
                                    accept=".js,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="js-file-input"
                                />
                                <label
                                    htmlFor="js-file-input"
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-md cursor-pointer text-sm transition-colors duration-200"
                                >
                                    Upload File
                                </label>
                            </div>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500"
                            placeholder="function example() {
    // Your JavaScript code here
    const message = 'Hello, World!';
    console.log(message);
}"
                        />
                    </div>

                    {/* Output Section */}
                    <div>
                        {mode === 'compress' ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-300">Compressed Output</label>
                                    {output && (
                                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCopy}
                                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors duration-200"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <textarea
                                    value={output}
                                    readOnly
                                    className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono"
                                    placeholder="Compressed code will appear here..."
                                />
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Validation Results</label>
                                <div className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 overflow-y-auto">
                                    {validationResults.length === 0 ? (
                                        <div className="text-green-400 text-sm">No issues found!</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {validationResults.map((result, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-2 rounded border ${getSeverityColor(result.severity)}`}
                                                >
                                                    <div className="flex justify-between text-sm">
                                                        <span>Line {result.line}:{result.column}</span>
                                                        <span className="font-semibold">{result.severity.toUpperCase()}</span>
                                                    </div>
                                                    <p className="mt-1 text-sm">{result.message}</p>
                                                    {result.ruleId && (
                                                        <p className="mt-1 text-xs opacity-75">Rule: {result.ruleId}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compression Stats */}
                {mode === 'compress' && stats && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-md p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-sm text-slate-400">Original Size</div>
                                <div className="text-lg font-semibold text-slate-200">{stats.originalSize} bytes</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-400">Compressed Size</div>
                                <div className="text-lg font-semibold text-slate-200">{stats.compressedSize} bytes</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-400">Savings</div>
                                <div className="text-lg font-semibold text-cyan-400">{stats.savings.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleProcess}
                        disabled={processing}
                        className={`bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 ${
                            processing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {processing ? 'Processing...' : mode === 'compress' ? 'Compress' : 'Validate'}
                    </button>
                    <button
                        onClick={handleClear}
                        className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        Clear
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm font-mono">
                        {error}
                    </div>
                )}
            </div>
        </ToolCard>
    );
};

export default JavaScriptToolkit;