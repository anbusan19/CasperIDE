import React from 'react';
import { FileNode } from '../../types';
import { SmartFileIcon, XIcon } from '../UI/Icons';

interface EditorTabsProps {
  files: FileNode[];
  openFileIds: string[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({ 
  files, 
  openFileIds, 
  activeFileId, 
  onSelect, 
  onClose 
}) => {
  
  // Helper to find file details for display
  const findFileDetails = (nodes: FileNode[], id: string): { name: string, type: string } | null => {
    for (const node of nodes) {
      if (node.id === id) return { name: node.name, type: node.type };
      if (node.children) {
        const found = findFileDetails(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  if (openFileIds.length === 0) return null;

  return (
    <div className="flex bg-caspier-black border-b border-caspier-border overflow-x-auto scrollbar-hide">
      {openFileIds.map((id) => {
        const file = findFileDetails(files, id);
        if (!file) return null;
        
        const isActive = id === activeFileId;
        
        return (
          <div
            key={id}
            onClick={() => onSelect(id)}
            className={`
              group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer min-w-[120px] max-w-[200px] border-r border-caspier-border
              ${isActive 
                ? 'bg-caspier-dark text-caspier-text border-t-2 border-t-caspier-red' 
                : 'bg-caspier-black text-caspier-muted hover:text-caspier-text hover:bg-caspier-hover border-t-2 border-t-transparent'
              }
            `}
          >
            <SmartFileIcon name={file.name} className={`w-3 h-3 ${isActive ? 'text-caspier-red' : 'text-caspier-muted'}`} />
            <span className="truncate flex-1">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(id);
              }}
              className={`p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-caspier-hover ${isActive ? 'opacity-100' : ''}`}
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EditorTabs;