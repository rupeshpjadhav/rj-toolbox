import React, { useState } from 'react';
import ToolCard from './ToolCard';
import { Copy, CheckCheck } from './Icons';
import { securePassword, secureRandomString } from '../lib/secureRandom';
import { copyText } from '../lib/clipboard';

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  ambiguous: boolean;
}

const defaultPasswordOptions: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  ambiguous: false,
};

interface KeygenType {
  name: string;
  description: string;
  length: number;
  charset: string;
}

const keygenTypes: KeygenType[] = [
  {
    name: "Fort Knox Passwords",
    description: "Maximum security passwords that are nearly impossible to crack",
    length: 32,
    charset: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
  },
  {
    name: "WPA Key",
    description: "Suitable for WPA wifi passwords",
    length: 63,
    charset: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  },
  {
    name: "Wiki Key",
    description: "Suitable for wiki and documentation passwords",
    length: 20,
    charset: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  },
  {
    name: "API Key",
    description: "Perfect for API keys and access tokens",
    length: 32,
    charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  },
  {
    name: "MAC Address",
    description: "Generate random MAC addresses",
    length: 17,
    charset: "0123456789ABCDEF",
    // Special format: XX:XX:XX:XX:XX:XX
  }
];

const RandomGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'password' | 'keygen'>('password');
  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>(defaultPasswordOptions);
  const [password, setPassword] = useState('');
  const [selectedKeyType, setSelectedKeyType] = useState<KeygenType>(keygenTypes[0]);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');

  const generatePassword = () => {
    let sets: string[] = [];
    if (passwordOptions.uppercase) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (passwordOptions.lowercase) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (passwordOptions.numbers) sets.push('0123456789');
    if (passwordOptions.symbols) sets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

    if (!passwordOptions.ambiguous) {
      sets = sets.map(set => set.replace(/[1iIlL0Oo]/g, '')); // Remove ambiguous characters
    }

    try {
      setPassword(securePassword(sets, passwordOptions.length));
      setPasswordError('');
    } catch (e) {
      setPassword('');
      setPasswordError(e instanceof Error ? e.message : 'Could not generate a password.');
    }
  };

  const generateKeys = () => {
    const newKeys: string[] = [];
    for (let i = 0; i < 5; i++) {
      if (selectedKeyType.name === 'MAC Address') {
        const macParts = [];
        for (let j = 0; j < 6; j++) {
          const part = secureRandomString(selectedKeyType.charset, 2);
          macParts.push(part);
        }
        newKeys.push(macParts.join(':'));
      } else {
        newKeys.push(secureRandomString(selectedKeyType.charset, selectedKeyType.length));
      }
    }
    setGeneratedKeys(newKeys);
  };

  const handleCopyPassword = () => {
    copyText(password).then((ok) => {
      if (!ok) return;
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    });
  };

  const handleCopyKey = (index: number) => {
    copyText(generatedKeys[index]).then((ok) => {
      if (!ok) return;
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <ToolCard title="Random Generator" description="Generate secure passwords and various types of random keys">
      {/* Tab Selection */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            activeTab === 'password'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Password Generator
        </button>
        <button
          onClick={() => setActiveTab('keygen')}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            activeTab === 'keygen'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Key Generator
        </button>
      </div>

      {activeTab === 'password' ? (
        <div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
            <h3 className="font-semibold text-lg text-white mb-4">Password Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Password Length: {passwordOptions.length}
                </label>
                <input
                  type="range"
                  min="8"
                  max="128"
                  value={passwordOptions.length}
                  onChange={(e) => setPasswordOptions({
                    ...passwordOptions,
                    length: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={passwordOptions.uppercase}
                    onChange={(e) => setPasswordOptions({
                      ...passwordOptions,
                      uppercase: e.target.checked
                    })}
                    className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">Uppercase (A-Z)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={passwordOptions.lowercase}
                    onChange={(e) => setPasswordOptions({
                      ...passwordOptions,
                      lowercase: e.target.checked
                    })}
                    className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">Lowercase (a-z)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={passwordOptions.numbers}
                    onChange={(e) => setPasswordOptions({
                      ...passwordOptions,
                      numbers: e.target.checked
                    })}
                    className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">Numbers (0-9)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={passwordOptions.symbols}
                    onChange={(e) => setPasswordOptions({
                      ...passwordOptions,
                      symbols: e.target.checked
                    })}
                    className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">Symbols (!@#$%^&*)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={passwordOptions.ambiguous}
                    onChange={(e) => setPasswordOptions({
                      ...passwordOptions,
                      ambiguous: e.target.checked
                    })}
                    className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">Include Ambiguous Characters (1, l, I, 0, O)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={generatePassword}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
            >
              Generate Password
            </button>
            {passwordError && (
              <div role="alert" className="text-red-400 text-sm">{passwordError}</div>
            )}
            {password && (
              <div className="flex-grow flex items-center gap-2 bg-slate-800/60 p-3 rounded-md border border-slate-700">
                <span className="flex-grow font-mono text-white">{password}</span>
                <button
                  onClick={handleCopyPassword}
                  className="text-slate-400 hover:text-white transition-colors duration-200"
                  title="Copy to clipboard"
                >
                  {copiedPassword ? <CheckCheck /> : <Copy />}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
            <h3 className="font-semibold text-lg text-white mb-4">Key Type</h3>
            <select
              value={selectedKeyType.name}
              onChange={(e) => setSelectedKeyType(keygenTypes.find(t => t.name === e.target.value) || keygenTypes[0])}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
            >
              {keygenTypes.map(type => (
                <option key={type.name} value={type.name}>{type.name}</option>
              ))}
            </select>
            <p className="mt-2 text-sm text-slate-400">{selectedKeyType.description}</p>
          </div>

          <div className="mb-6">
            <button
              onClick={generateKeys}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
            >
              Generate Keys
            </button>
          </div>

          <div className="space-y-3">
            {generatedKeys.map((key, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-800/60 p-3 rounded-md border border-slate-700">
                <span className="flex-grow font-mono text-white break-all">{key}</span>
                <button
                  onClick={() => handleCopyKey(index)}
                  className="text-slate-400 hover:text-white transition-colors duration-200"
                  title="Copy to clipboard"
                >
                  {copiedIndex === index ? <CheckCheck /> : <Copy />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolCard>
  );
};

export default RandomGenerator;