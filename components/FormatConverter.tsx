import React, { useEffect, useState } from 'react';
import ToolCard from './ToolCard';
import { Copy, CheckCheck, ClearIcon } from './Icons';
import { copyText } from '../lib/clipboard';
import { convertData, detectFormat, SAMPLES, type DataFormat, type QuoteStyle } from '../lib/dataConvert';

const FORMATS: DataFormat[] = ['Column', 'CSV', 'TSV', 'JSON', 'XML'];

const EXTENSIONS: Record<DataFormat, string> = {
    Column: '.txt',
    CSV: '.csv',
    TSV: '.tsv',
    JSON: '.json',
    XML: '.xml',
};

const MIME_TYPES: Record<DataFormat, string> = {
    Column: 'text/plain;charset=utf-8',
    CSV: 'text/csv;charset=utf-8',
    TSV: 'text/tab-separated-values;charset=utf-8',
    JSON: 'application/json;charset=utf-8',
    XML: 'application/xml;charset=utf-8',
};

interface Message {
    kind: 'error' | 'warning';
    text: string;
}

const UniversalDataConverter: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [inputFormat, setInputFormat] = useState<DataFormat>('Column');
    const [outputFormat, setOutputFormat] = useState<DataFormat>('CSV');
    const [message, setMessage] = useState<Message | null>(null);
    const [copied, setCopied] = useState(false);
    const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
    const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>('double');
    const [quoteAll, setQuoteAll] = useState(true);

    // Auto-detect the input format when the input changes
    useEffect(() => {
        if (autoDetectEnabled && input.trim()) {
            setInputFormat(detectFormat(input));
        }
    }, [input, autoDetectEnabled]);

    const handleConvert = () => {
        const result = convertData(input, inputFormat, outputFormat, { quoteStyle, quoteAll });
        if (result.ok === false) {
            setOutput('');
            setMessage({ kind: 'error', text: result.error });
            return;
        }
        setOutput(result.output);
        setMessage(result.warnings.length
            ? { kind: 'warning', text: `Warning: ${result.warnings.join(' ')}` }
            : null);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setInput(String(e.target?.result ?? ''));
            reader.onerror = () => setMessage({ kind: 'error', text: 'Failed to read the uploaded file.' });
            reader.readAsText(file);
            event.target.value = ''; // Allow re-uploading the same file
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
        const blob = new Blob([output], { type: MIME_TYPES[outputFormat] });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_data${EXTENSIONS[outputFormat]}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
        setMessage(null);
    };

    const formatOptions = FORMATS.map(f => <option key={f} value={f}>{f}</option>);

    return (
        <ToolCard title="Universal Data Converter" description="Convert between Column, CSV, TSV, JSON and XML in any direction. Select your input and output formats, then convert.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="input-format" className="text-sm font-medium text-slate-300">Input Format</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={autoDetectEnabled}
                                    onChange={(e) => setAutoDetectEnabled(e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-cyan-500 rounded border-slate-600 bg-slate-700 focus:ring-cyan-500"
                                />
                                <span className="ml-2 text-sm text-slate-300">Auto-detect</span>
                            </label>
                            <label htmlFor="file-upload" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold py-1 px-3 rounded-md transition-colors duration-200">
                                Upload File
                            </label>
                        </div>
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv,.tsv,.json,.xml,.txt" />
                    </div>
                    <select
                        id="input-format"
                        value={inputFormat}
                        onChange={e => setInputFormat(e.target.value as DataFormat)}
                        disabled={autoDetectEnabled}
                        className={`w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 mb-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 ${autoDetectEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {formatOptions}
                    </select>
                    <textarea
                        aria-label="Input data"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-cyan-500"
                        placeholder={SAMPLES[inputFormat]}
                    />
                </div>

                {/* Output Section */}
                <div>
                    <label htmlFor="output-format" className="block text-sm font-medium text-slate-300 mb-2">Output Format</label>
                    <select
                        id="output-format"
                        value={outputFormat}
                        onChange={e => setOutputFormat(e.target.value as DataFormat)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 mb-2 text-sm text-white focus:ring-2 focus:ring-cyan-500"
                    >
                        {formatOptions}
                    </select>

                    {/* Quote options: only for CSV/TSV output */}
                    {(outputFormat === 'CSV' || outputFormat === 'TSV') && (
                        <div className="space-y-2 mb-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-300">Quote Style</label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={quoteAll}
                                        onChange={(e) => setQuoteAll(e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-cyan-500 rounded border-slate-600 bg-slate-700 focus:ring-cyan-500"
                                    />
                                    <span className="ml-2 text-sm text-slate-300">Quote All Values</span>
                                </label>
                            </div>
                            <select
                                value={quoteStyle}
                                onChange={e => setQuoteStyle(e.target.value as QuoteStyle)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="none">Only when required</option>
                                <option value="double">Double Quotes (")</option>
                                <option value="single">Single Quotes (')</option>
                            </select>
                        </div>
                    )}

                    <div className="relative">
                        <textarea
                            aria-label="Converted output"
                            value={output}
                            readOnly
                            className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono"
                            placeholder="-- Converted data appears here"
                        />
                        {output && (
                            <button onClick={handleCopy} className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors duration-200 z-10" title="Copy to clipboard">
                                {copied ? <CheckCheck /> : <Copy />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions and messages */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                    onClick={handleConvert}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
                >
                    Convert
                </button>
                {output && (
                    <button
                        onClick={handleDownload}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        Download
                    </button>
                )}
                <button onClick={handleClear} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2">
                    <ClearIcon /> Clear
                </button>
            </div>
            {message && (
                <div
                    role={message.kind === 'error' ? 'alert' : 'status'}
                    className={`mt-4 p-3 ${message.kind === 'warning' ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' : 'bg-red-900/50 border-red-700 text-red-300'} rounded-md text-sm font-mono`}
                >
                    {message.text}
                </div>
            )}

            {/* Examples */}
            <div className="mt-8">
                <details className="bg-slate-900/50 border border-slate-700 rounded-lg">
                    <summary className="cursor-pointer p-4 font-semibold text-slate-300">View Examples</summary>
                    <div className="p-4 border-t border-slate-700 space-y-4">
                        {FORMATS.map(format => (
                            <div key={format}>
                                <h4 className="font-bold text-cyan-400 mb-1">{format}</h4>
                                <pre className="bg-slate-900 p-3 rounded-md text-xs font-mono whitespace-pre-wrap">{SAMPLES[format]}</pre>
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        </ToolCard>
    );
};

export default UniversalDataConverter;
