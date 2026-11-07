import React, { useState } from 'react';
import ToolCard from './ToolCard';
import yamlParser from 'js-yaml';

const exampleYaml = `name: Example Workflow
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
`;

const YamlValidatorTool: React.FC = () => {
  const [yaml, setYaml] = useState(exampleYaml);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Local-only validation
  const handleValidate = () => {
    setError(null);
    setResult(null);
    try {
      yamlParser.load(yaml);
      setResult('YAML syntax is valid!');
    } catch (e: any) {
      setError('YAML syntax error: ' + e.message);
    }
  };

  return (
    <ToolCard title="YAML Validator" description="Validate your YAML files for syntax correctness.">
      <textarea
        value={yaml}
        onChange={e => setYaml(e.target.value)}
        rows={12}
        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white font-mono mb-4"
        placeholder="Paste your YAML here..."
      />
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleValidate}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
        >
          Validate YAML
        </button>
      </div>
      {result && <div className="text-green-400 mb-2">{result}</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
    </ToolCard>
  );
};

export default YamlValidatorTool;
