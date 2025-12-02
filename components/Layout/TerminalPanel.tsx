
import React, { useState } from 'react';
import { TerminalLine, Problem } from '../../types';
import { CheckIcon, XIcon, BugIcon } from '../UI/Icons';

interface TerminalPanelProps {
  terminalLines: TerminalLine[];
  outputLines: string[];
  problems: Problem[];
  height: number;
}

type TerminalTab = 'TERMINAL' | 'OUTPUT' | 'PROBLEMS';

const TerminalPanel: React.FC<TerminalPanelProps> = ({ terminalLines, outputLines, problems, height }) => {
  const [activeTab, setActiveTab] = useState<TerminalTab>('TERMINAL');

  const renderTerminal = () => (
    <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
        <div className="text-caspier-muted mb-2">Welcome to Caspier Shell v1.0.0</div>
        {terminalLines.map((line) => (
            <div key={line.id} className="flex gap-2">
                {line.type === 'command' && <span className="text-caspier-red font-bold">➜  ~</span>}
                <span className={`${
                    line.type === 'error' ? 'text-red-500' :
                    line.type === 'success' ? 'text-green-500' :
                    line.type === 'command' ? 'text-caspier-text' :
                    'text-caspier-muted'
                }`}>
                    {line.content}
                </span>
                {line.type === 'success' && <CheckIcon className="w-3 h-3 text-green-500 inline" />}
            </div>
        ))}
        <div className="flex gap-2 items-center mt-2">
            <span className="text-caspier-red font-bold">➜  ~</span>
            <span className="w-2 h-4 bg-caspier-muted animate-pulse"></span>
        </div>
    </div>
  );

  const renderOutput = () => (
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 bg-caspier-black">
          {outputLines.length === 0 && <div className="text-caspier-muted italic">No output generated.</div>}
          {outputLines.map((line, idx) => (
              <div key={idx} className="text-caspier-muted whitespace-pre-wrap font-sans">{line}</div>
          ))}
      </div>
  );

  const renderProblems = () => (
      <div className="flex-1 overflow-y-auto p-0 text-xs">
          {problems.length === 0 ? (
              <div className="p-4 text-caspier-muted italic flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-green-500" />
                  No problems detected in workspace.
              </div>
          ) : (
              <table className="w-full text-left border-collapse">
                  <thead className="bg-caspier-panel text-caspier-muted font-bold sticky top-0">
                      <tr>
                          <th className="p-2 w-16"></th>
                          <th className="p-2">Description</th>
                          <th className="p-2 w-32">File</th>
                          <th className="p-2 w-24">Location</th>
                      </tr>
                  </thead>
                  <tbody>
                      {problems.map(prob => (
                          <tr key={prob.id} className="border-b border-caspier-border/50 hover:bg-caspier-hover group">
                              <td className="p-2 text-center">
                                  {prob.severity === 'error' ? (
                                      <XIcon className="w-4 h-4 text-red-500 inline" />
                                  ) : (
                                      <BugIcon className="w-4 h-4 text-yellow-500 inline" />
                                  )}
                              </td>
                              <td className="p-2 text-caspier-text">{prob.description}</td>
                              <td className="p-2 text-caspier-muted">{prob.file}</td>
                              <td className="p-2 text-caspier-muted">[{prob.line}, {prob.column}]</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
      </div>
  );

  return (
    <div className="bg-caspier-black border-t border-caspier-border w-full flex flex-col" style={{ height: `${height}px` }}>
        <div className="flex border-b border-caspier-border bg-caspier-panel">
            {(['TERMINAL', 'OUTPUT', 'PROBLEMS'] as TerminalTab[]).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1 text-xs font-bold border-t-2 transition-colors ${
                        activeTab === tab 
                        ? 'text-caspier-red border-caspier-red bg-caspier-black' 
                        : 'text-caspier-muted border-transparent hover:text-caspier-text hover:bg-caspier-hover'
                    }`}
                >
                    {tab} {tab === 'PROBLEMS' && problems.length > 0 && `(${problems.length})`}
                </button>
            ))}
        </div>
        
        {activeTab === 'TERMINAL' && renderTerminal()}
        {activeTab === 'OUTPUT' && renderOutput()}
        {activeTab === 'PROBLEMS' && renderProblems()}
    </div>
  );
};

export default TerminalPanel;
