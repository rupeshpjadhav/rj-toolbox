import React, { useState, useEffect } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import ToolCard from './ToolCard';
import { parseJsLiteral } from '../lib/jsObjectParser';
import { copyText } from '../lib/clipboard';

interface ValidationResult {
    isValid: boolean;
    error?: string;
    note?: string;
}

const JSONToolkit: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [indentSize, setIndentSize] = useState(2);

    // Validate automatically as user types
    useEffect(() => {
        if (!input.trim()) {
            setValidationResult(null);
            setOutput('');
            return;
        }

        try {
            JSON.parse(input);
            setValidationResult({ isValid: true });
        } catch (e) {
            const jsonError = e instanceof Error ? e.message : 'Invalid JSON';
            try {
                // Not JSON, but a valid JS object literal is accepted by Stringify.
                parseJsLiteral(input);
                setValidationResult({
                    isValid: true,
                    note: 'Valid JavaScript object. Click Stringify to convert it to JSON.'
                });
            } catch {
                setValidationResult({ isValid: false, error: jsonError });
            }
        }
    }, [input]);

    const handleStringify = () => {
        if (!input.trim()) return;

        try {
            // Parse the input as a JavaScript object/array literal. Nothing is executed.
            const parsedObj = parseJsLiteral(input);
            const jsonString = JSON.stringify(parsedObj);
            setOutput(jsonString); // Show the stringified result in the output box
            setValidationResult({ isValid: true });
        } catch (e) {
            setValidationResult({
                isValid: false,
                error: e instanceof Error ? e.message : 'Invalid JavaScript object/array'
            });
            setOutput('');
        }
    };

    const handleBeautify = () => {
        if (!input.trim()) return;

        try {
            const parsed = JSON.parse(input);
            const beautified = JSON.stringify(parsed, null, indentSize);
            setOutput(beautified);
            setValidationResult({ isValid: true });
        } catch (e) {
            setValidationResult({
                isValid: false,
                error: e instanceof Error ? e.message : 'Invalid JSON'
            });
            setOutput('');
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

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
        setValidationResult(null);
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

    return (
        <ToolCard 
            title="JSON Toolkit" 
            description="Format, validate, and beautify JSON data. Supports JavaScript objects and automatic validation."
        >
            <div className="space-y-6">
                {/* Validation Status */}
                {validationResult && (
                    <div className={`text-sm font-semibold ${
                        validationResult.isValid ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {validationResult.isValid ? (validationResult.note ?? 'JSON is valid') : 'JSON is invalid'}
                    </div>
                )}

                {/* Input */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-300">Input JSON or JavaScript Object</label>
                        <div>
                            <input
                                type="file"
                                accept=".json,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="json-file-input"
                            />
                            <label
                                htmlFor="json-file-input"
                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-md cursor-pointer text-sm transition-colors duration-200"
                            >
                                Upload File
                            </label>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className={`w-full h-48 bg-slate-900 border rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500 ${
                            validationResult
                                ? validationResult.isValid
                                    ? 'border-green-600'
                                    : 'border-red-600'
                                : 'border-slate-700'
                        }`}
                        placeholder={`Enter your JSON or JavaScript object here...\nExample JSON:\n{\n  "name": "John",\n  "age": 30\n}\n\nExample JavaScript object:\n{ name: "John", age: 30 }`}
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleStringify}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                        title="Convert JavaScript object to JSON string"
                    >
                        Stringify
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBeautify}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                            title="Format and indent JSON"
                        >
                            Beautify
                        </button>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-300">Indent:</label>
                            <select
                                value={indentSize}
                                onChange={(e) => setIndentSize(Number(e.target.value))}
                                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                            >
                                <option value="2">2</option>
                                <option value="4">4</option>
                                <option value="8">8</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        Clear
                    </button>
                </div>

                {/* Output */}
                {output && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-slate-300">Formatted JSON</label>
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
                        </div>
                        <pre className="w-full h-48 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono overflow-auto">
                            {output}
                        </pre>
                    </div>
                )}

                {/* Error Display */}
                {validationResult && !validationResult.isValid && validationResult.error && (
                    <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm font-mono">
                        {validationResult.error}
                    </div>
                )}
            </div>
        </ToolCard>
    );
};

export default JSONToolkit;
