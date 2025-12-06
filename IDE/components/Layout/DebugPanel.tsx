import React, { useState } from 'react';
import { CompilationResult } from '../../types';
import WasmViewer from '../Debug/WasmViewer';
import MetadataInspector from '../Debug/MetadataInspector';
import { BugIcon } from '../UI/Icons';

interface DebugPanelProps {
  compilationResult?: CompilationResult;
}

type DebugTab = 'wasm' | 'metadata';

const DebugPanel: React.FC<DebugPanelProps> = ({ compilationResult }) => {
  const [activeTab, setActiveTab] = useState<DebugTab>('wasm');

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-caspier-border flex items-center gap-2 bg-caspier-black">
        <BugIcon className="w-4 h-4 text-caspier-muted" />
        <span className="text-xs font-bold text-caspier-text tracking-wider">DEBUG</span>
      </div>
      
      <div className="flex border-b border-caspier-border bg-caspier-black">
        <button
          onClick={() => setActiveTab('wasm')}
          className={`px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'wasm'
              ? 'text-caspier-red border-b-2 border-caspier-red'
              : 'text-caspier-muted hover:text-caspier-text'
          }`}
        >
          WASM Viewer
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`px-4 py-2 text-xs font-bold transition-colors ${
            activeTab === 'metadata'
              ? 'text-caspier-red border-b-2 border-caspier-red'
              : 'text-caspier-muted hover:text-caspier-text'
          }`}
        >
          Metadata
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'wasm' && <WasmViewer compilationResult={compilationResult} />}
        {activeTab === 'metadata' && <MetadataInspector compilationResult={compilationResult} />}
      </div>
    </div>
  );
};

export default DebugPanel;










