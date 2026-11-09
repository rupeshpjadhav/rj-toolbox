import React, { useEffect, lazy, Suspense } from 'react';
import toolPages from './lib/toolPages.json';
import { AdSlot } from './components/AdSlot';
import { loadAdSense } from './lib/ads';
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



// Page content (titles, descriptions, H1s, guides) lives in lib/toolPages.json and is shared with
// scripts/prerender.mjs, which writes one static HTML page per tool at build time. The site header,
// H1, intro text, guide and footer are part of that static HTML; this app renders the tool menu and
// the interactive tool.
const TOOL_COMPONENTS: Record<string, { component: React.ReactNode; icon: React.ReactNode }> = {
  'test-data-generator': { component: <TestDataGenerator />, icon: <IconTestData /> },
  'password-generator': { component: <RandomGenerator />, icon: <IconKey /> },
  'csv-json-converter': { component: <FormatConverter />, icon: <IconDataConverter /> },
  'javascript-minifier': { component: <JavaScriptToolkit />, icon: <IconCompress /> },
  'json-formatter': { component: <JSONToolkit />, icon: <IconJson /> },
  'sql-formatter': { component: <SqlQueryAnalyzer />, icon: <IconSql /> },
  'diff-checker': { component: <DifferenceChecker />, icon: <IconDiff /> },
  'case-converter': { component: <CaseConverter />, icon: <IconCase /> },
  'camel-case-converter': { component: <TextStyler />, icon: <IconStyle /> },
  'yaml-validator': { component: <YamlValidatorTool />, icon: <IconJson /> },
};

const tools = toolPages.tools.map(t => ({ slug: t.slug, name: t.name, ...TOOL_COMPONENTS[t.slug] }));

/** The tool for the current URL, e.g. /json-formatter/ -> json-formatter. The home page shows the first tool. */
const toolFromPath = (pathname: string) => {
  const slug = pathname.split('/').filter(Boolean)[0] ?? '';
  return tools.find(t => t.slug === slug) ?? tools[0];
};

const App: React.FC = () => {
  const activeTool = toolFromPath(typeof window === 'undefined' ? '/' : window.location.pathname);

  useEffect(() => {
    loadAdSense();
  }, []);

  return (
    <div className="text-white font-sans">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <nav aria-label="Tools" className="mb-8 flex flex-wrap gap-2">
          {tools.map(tool => {
            const active = tool.slug === activeTool.slug;
            return (
              <a
                key={tool.slug}
                href={`/${tool.slug}/`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm sm:text-base sm:px-4 sm:py-2 transition-colors duration-200 ${
                  active
                    ? 'bg-cyan-600 text-white font-semibold shadow-lg'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {tool.icon}
                <span>{tool.name}</span>
              </a>
            );
          })}
        </nav>
        <AdSlot id="top" minHeight={90} />
        <div className="animate-fade-in">
          {/* Each tool is a separate chunk, loaded the first time it is opened */}
          <Suspense fallback={<div className="text-slate-400 py-12 text-center min-h-[600px]" role="status">Loading tool…</div>}>
            {activeTool.component}
          </Suspense>
        </div>
        <AdSlot id="bottom" minHeight={250} />
      </main>
    </div>
  );
};
export default App;