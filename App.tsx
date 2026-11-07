import React, { useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
const CaseConverter = lazy(() => import('./components/CaseConverter'));
const DifferenceChecker = lazy(() => import('./components/DifferenceChecker'));
const FormatConverter = lazy(() => import('./components/FormatConverter'));
const JSONToolkit = lazy(() => import('./components/JSONToolkit'));
const SqlQueryAnalyzer = lazy(() => import('./components/SqlQueryAnalyzer'));
const TextStyler = lazy(() => import('./components/TextStyler'));
const TestDataGenerator = lazy(() => import('./components/TestDataGenerator'));
const JavaScriptToolkit = lazy(() => import('./components/JavaScriptToolkit'));
const RandomGenerator = lazy(() => import('./components/RandomGenerator'));

const YamlValidatorTool = lazy(() => import('./components/YamlValidatorTool'));
import {
  IconDataConverter,
  IconSql,
  IconDiff,
  IconJson,
  IconCase,
  IconStyle,
  IconTestData,
  IconCompress,
  IconKey
} from './components/Icons';



const tools = [
  {
    name: 'Test Data Generator',
    component: <TestDataGenerator />, icon: <IconTestData />,
    seo: {
      title: 'Test Data Generator - My Toolbox',
      description: 'Generate test data in JSON, CSV, SQL, and other formats for development and QA.'
    }
  },
  {
    name: 'Random Generator',
    component: <RandomGenerator />, icon: <IconKey />,
    seo: {
      title: 'Random Generator - My Toolbox',
      description: 'Generate random strings, numbers, passwords, and more for testing and security.'
    }
  },
  {
    name: 'Data Converter',
    component: <FormatConverter />, icon: <IconDataConverter />,
    seo: {
      title: 'Data Converter - My Toolbox',
      description: 'Convert between CSV, TSV, JSON, and single-column text. Fast, accurate, and easy data conversion for developers and analysts.'
    }
  },
  {
    name: 'JavaScript Toolkit',
    component: <JavaScriptToolkit />, icon: <IconCompress />,
    seo: {
      title: 'JavaScript Toolkit - My Toolbox',
      description: 'Handy JavaScript utilities for formatting, minifying, and analyzing your code.'
    }
  },
  {
    name: 'JSON Toolkit',
    component: <JSONToolkit />, icon: <IconJson />,
    seo: {
      title: 'JSON Toolkit - My Toolbox',
      description: 'Validate, beautify, and convert JSON data. Essential tools for developers working with APIs and data.'
    }
  },
  {
    name: 'SQL Formatter',
    component: <SqlQueryAnalyzer />, icon: <IconSql />,
    seo: {
      title: 'SQL Formatter - My Toolbox',
      description: 'Format, beautify, and analyze SQL queries for better readability and performance.'
    }
  },
  {
    name: 'Difference Checker',
    component: <DifferenceChecker />, icon: <IconDiff />,
    seo: {
      title: 'Difference Checker - My Toolbox',
      description: 'Compare files, text, or code to find differences and similarities.'
    }
  },
  {
    name: 'Case Converter',
    component: <CaseConverter />, icon: <IconCase />,
    seo: {
      title: 'Case Converter - My Toolbox',
      description: 'Convert text between uppercase, lowercase, camelCase, snake_case, and more.'
    }
  },
  {
    name: 'Text Styler',
    component: <TextStyler />, icon: <IconStyle />,
    seo: {
      title: 'Text Styler - My Toolbox',
      description: 'Style and format your text for social media, documents, and more.'
    }
  },
  {
    name: 'YAML Validator',
    component: <YamlValidatorTool />, icon: <IconJson />,
    seo: {
      title: 'YAML Validator - My Toolbox',
      description: 'Validate and format YAML files for configuration, CI/CD, and more.'
    }
  }
];

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState(tools[0].name);

  const activeToolObj = tools.find(tool => tool.name === activeTool);
  const ActiveToolComponent = activeToolObj?.component;

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <Helmet>
        <title>{activeToolObj?.seo?.title || 'My Toolbox - All-in-One Online Tools'}</title>
        <meta name="description" content={activeToolObj?.seo?.description || 'My Toolbox: A collection of online tools for data conversion, validation, formatting, and more.'} />
        <meta property="og:title" content={activeToolObj?.seo?.title || 'My Toolbox - All-in-One Online Tools'} />
        <meta property="og:description" content={activeToolObj?.seo?.description || 'A collection of online tools for developers and data wranglers.'} />
      </Helmet>
      <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-cyan-400">
              {activeToolObj?.seo?.title || 'Toolkit by Rupesh'}
            </h1>
          </div>
          <div className="text-center mt-2 text-slate-500 text-sm">
            <span>Created by <a href="https://www.linkedin.com/in/rupeshj/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Rupesh Jadhav</a></span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <nav className="flex flex-wrap gap-2">
            {tools.map(tool => (
              <button
                key={tool.name}
                onClick={() => setActiveTool(tool.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm sm:text-base sm:px-4 sm:py-2 transition-colors duration-200 ${
                  activeTool === tool.name
                    ? 'bg-cyan-600 text-white font-semibold shadow-lg'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {tool.icon}
                <span>{tool.name}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="animate-fade-in">
          {/* Each tool is a separate chunk, loaded the first time it is opened */}
          <Suspense fallback={<div className="text-slate-400 py-12 text-center" role="status">Loading tool…</div>}>
            {ActiveToolComponent}
          </Suspense>
        </div>
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Built with React, TypeScript, and TailwindCSS.<br />
        Created by <a href="https://www.linkedin.com/in/rupeshj/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Rupesh Jadhav</a></p>
      </footer>
    </div>
  );
};
export default App;