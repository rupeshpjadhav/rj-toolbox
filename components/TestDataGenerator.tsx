import React, { useState } from 'react';
import { copyText } from '../lib/clipboard';
import ToolCard from './ToolCard';
import { csvFormat } from 'd3-dsv';
import { toPythonLiteral } from '../lib/pythonLiteral';
import { escapeMarkup } from '../lib/markup';
import { Copy, CheckCheck, ClearIcon } from './Icons';

type DataType = 'RowNumber' | 'UUID' | 'FullName' | 'FirstName' | 'LastName' | 'Email' | 'PhoneNumber' | 'City' | 'Country' | 'RandomNumber' | 'RandomWords';

interface Column {
  id: number;
  name: string;
  type: DataType;
}

const defaultColumns: Column[] = [
  { id: 1, name: 'id', type: 'RowNumber' },
  { id: 2, name: 'name', type: 'FullName' },
  { id: 3, name: 'email', type: 'Email' },
];

const dataTypes: DataType[] = ['RowNumber', 'UUID', 'FullName', 'FirstName', 'LastName', 'Email', 'PhoneNumber', 'City', 'Country', 'RandomNumber', 'RandomWords'];

const TestDataGenerator: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [rowCount, setRowCount] = useState<number>(10);
  const [outputFormat, setOutputFormat] = useState<'JSON' | 'CSV' | 'XML' | 'HTML' | 'SQL' | 'Python' | 'JavaScript'>('JSON');
  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const addColumn = () => {
    const newId = (columns[columns.length - 1]?.id || 0) + 1;
    setColumns([...columns, { id: newId, name: `column${newId}`, type: 'RandomWords' }]);
  };

  const removeColumn = (id: number) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const updateColumn = (id: number, field: 'name' | 'type', value: string) => {
    setColumns(columns.map(col => col.id === id ? { ...col, [field]: value } : col));
  };

  const generateData = async () => {
    // Loaded on first use so the faker library is not part of the initial page load.
    const { faker } = await import('@faker-js/faker');
    const data = [];
    const count = Math.min(1000, Math.max(1, rowCount || 1));
    for (let i = 1; i <= count; i++) {
      const row: { [key: string]: any } = {};
      for (const col of columns) {
        switch (col.type) {
          case 'RowNumber':
            row[col.name] = i;
            break;
          case 'UUID':
            row[col.name] = faker.string.uuid();
            break;
          case 'FullName':
            row[col.name] = faker.person.fullName();
            break;
          case 'FirstName':
            row[col.name] = faker.person.firstName();
            break;
          case 'LastName':
            row[col.name] = faker.person.lastName();
            break;
          case 'Email':
            row[col.name] = faker.internet.email();
            break;
          case 'PhoneNumber':
            row[col.name] = faker.phone.number();
            break;
          case 'City':
            row[col.name] = faker.location.city();
            break;
          case 'Country':
            row[col.name] = faker.location.country();
            break;
          case 'RandomNumber':
            row[col.name] = faker.number.int({ min: 1, max: 1000 });
            break;
          case 'RandomWords':
            row[col.name] = faker.lorem.words(3);
            break;
        }
      }
      data.push(row);
    }
    return data;
  };

  const convertToXml = (data: any[]): string => {
    const rows = data.map(row => {
      const fields = Object.entries(row).map(([key, value]) => 
        `    <${escapeMarkup(key)}>${escapeMarkup(value)}</${escapeMarkup(key)}>`
      ).join('\n');
      return `  <row>\n${fields}\n  </row>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${rows}\n</data>`;
  };

  const convertToHtml = (data: any[]): string => {
    const headers = Object.keys(data[0] || {});
    const headerRow = headers.map(h => `    <th>${escapeMarkup(h)}</th>`).join('\n');
    const rows = data.map(row => {
      const cells = headers.map(h => `    <td>${escapeMarkup(row[h])}</td>`).join('\n');
      return `  <tr>\n${cells}\n  </tr>`;
    }).join('\n');
    
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <table>
    <tr>\n${headerRow}\n    </tr>\n${rows}
  </table>
</body>
</html>`;
  };

  const convertToSql = (data: any[]): string => {
    if (data.length === 0) return '';
    const tableName = 'generated_data';
    const columns = Object.keys(data[0]);
    const createTable = `CREATE TABLE ${tableName} (\n  ${columns.map(col => 
      `${col} ${typeof data[0][col] === 'number' ? 'INTEGER' : 'VARCHAR(255)'}` 
    ).join(',\n  ')}\n);\n\n`;
    
    const insertStatements = data.map(row => {
      const values = Object.values(row).map(val => 
        typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
      ).join(', ');
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
    }).join('\n');
    
    return createTable + insertStatements;
  };

  const convertToPython = (data: any[]): string => {
    return `data = ${toPythonLiteral(data)}`;
  };

  const convertToJavaScript = (data: any[]): string => {
    return `const data = ${JSON.stringify(data, null, 2)};`;
  };

  const handleGenerate = async () => {
    const generated = await generateData();
    switch (outputFormat) {
      case 'JSON':
        setOutput(JSON.stringify(generated, null, 2));
        break;
      case 'CSV':
        setOutput(csvFormat(generated));
        break;
      case 'XML':
        setOutput(convertToXml(generated));
        break;
      case 'HTML':
        setOutput(convertToHtml(generated));
        break;
      case 'SQL':
        setOutput(convertToSql(generated));
        break;
      case 'Python':
        setOutput(convertToPython(generated));
        break;
      case 'JavaScript':
        setOutput(convertToJavaScript(generated));
        break;
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
    const fileExtensionMap: Record<typeof outputFormat, string> = {
      JSON: '.json',
      CSV: '.csv',
      XML: '.xml',
      HTML: '.html',
      SQL: '.sql',
      Python: '.py',
      JavaScript: '.js'
    };
    const fileExtension = fileExtensionMap[outputFormat];
    const mimeTypeMap: Record<typeof outputFormat, string> = {
      JSON: 'application/json',
      CSV: 'text/csv',
      XML: 'application/xml',
      HTML: 'text/html',
      SQL: 'text/plain',
      Python: 'text/x-python',
      JavaScript: 'application/javascript'
    };
    const mimeType = mimeTypeMap[outputFormat];
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_data${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <ToolCard title="Test Data Generator" description="Define your data structure, and generate realistic test data as JSON, CSV, XML, HTML, SQL, Python or JavaScript.">
      {/* Configuration */}
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
        <h3 className="font-semibold text-lg text-white mb-4">Configuration</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Number of Rows</label>
            <input
              type="number"
              value={rowCount}
              onChange={e => setRowCount(Number.parseInt(e.target.value, 10) || 0)}
              min="1"
              max="1000"
              className="w-32 bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Output Format</label>
            <select
              value={outputFormat}
              onChange={e => setOutputFormat(e.target.value as typeof outputFormat)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white"
            >
              <option value="JSON">JSON</option>
              <option value="CSV">CSV</option>
              <option value="XML">XML</option>
              <option value="HTML">HTML</option>
              <option value="SQL">SQL</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
            </select>
          </div>
        </div>
      </div>

      {/* Column Definitions */}
      <div className="space-y-3 mb-6">
         <h3 className="font-semibold text-lg text-white">Column Definitions</h3>
        {columns.map((col, index) => (
          <div key={col.id} className="flex flex-wrap items-center gap-3 bg-slate-800/60 p-3 rounded-md border border-slate-700">
            <input
              type="text"
              value={col.name}
              onChange={e => updateColumn(col.id, 'name', e.target.value)}
              placeholder="Column Name"
              className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white"
            />
            <select
              value={col.type}
              onChange={e => updateColumn(col.id, 'type', e.target.value)}
              className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-white"
            >
              {dataTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <button
              onClick={() => removeColumn(col.id)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-3 rounded-md text-sm"
            >
              Remove
            </button>
          </div>
        ))}
         <button onClick={addColumn} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
            Add Column
        </button>
      </div>

       {/* Actions & Output */}
       <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
                onClick={handleGenerate}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
            >
                Generate Data
            </button>
            {output && (
            <>
                <button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                >
                    Download
                </button>
            </>
            )}
        </div>
        <div className="relative mt-4">
            <textarea
                value={output}
                readOnly
                className="w-full h-80 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm font-mono"
                placeholder="-- Generated data will appear here --"
            />
            {output && (
                <button onClick={handleCopy} className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors duration-200 z-10" title="Copy to clipboard">
                    {copied ? <CheckCheck /> : <Copy />}
                </button>
            )}
        </div>
    </ToolCard>
  );
};

export default TestDataGenerator;