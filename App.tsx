

import React, { useState, useEffect, useCallback } from 'react';
import { FileNode, ActivityView, TerminalLine, ProjectSettings, GitState, GitCommit, Problem } from './types';
import { INITIAL_FILES, DEFAULT_SETTINGS } from './constants';
import ActivityBar from './components/Layout/ActivityBar';
import SidebarLeft from './components/Layout/SidebarLeft';
import SidebarRight from './components/Layout/SidebarRight';
import TerminalPanel from './components/Layout/TerminalPanel';
import CodeEditor from './components/Editor/CodeEditor';
import EditorTabs from './components/Layout/EditorTabs';
import Header from './components/Layout/Header';
import { Button } from './components/UI/Button';
import { PlayIcon, BotIcon, RocketIcon } from './components/UI/Icons';
import JSZip from 'jszip';

function App() {
  const [activeView, setActiveView] = useState<ActivityView>(ActivityView.EXPLORER);
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Workspace State
  const [workspaces, setWorkspaces] = useState<Record<string, FileNode[]>>({
      'default_workspace': INITIAL_FILES
  });
  const [activeWorkspace, setActiveWorkspace] = useState('default_workspace');

  // History State
  const [history, setHistory] = useState<FileNode[][]>([INITIAL_FILES]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Derived state for current file tree
  const files = history[historyIndex];

  // Editor Tabs State
  const [openFiles, setOpenFiles] = useState<string[]>(['main.rs']);
  const [activeFileId, setActiveFileId] = useState<string | null>('main.rs');
  
  const [activeContent, setActiveContent] = useState<string>('');
  const [activeLanguage, setActiveLanguage] = useState<string>('rust');
  
  // Terminal, Output, Problems State
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
      { id: '1', type: 'info', content: 'Initializing Caspier Environment...' },
      { id: '2', type: 'success', content: 'Casper Environment Ready.' }
  ]);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);

  // Project Settings
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);

  // Git State
  const [gitState, setGitState] = useState<GitState>({
      modifiedFiles: [],
      stagedFiles: [],
      commits: [
          // Simulated History
          { id: 'c-5', message: 'Merge branch feature/auth', date: Date.now() - 1000000, hash: '8f2a1b', branch: 'main', parents: ['c-4', 'c-3'] },
          { id: 'c-4', message: 'Update configuration', date: Date.now() - 2000000, hash: '7e1c9d', branch: 'main', parents: ['c-2'] },
          { id: 'c-3', message: 'Implement login logic', date: Date.now() - 2500000, hash: '6d4e5f', branch: 'feature/auth', parents: ['c-1'] },
          { id: 'c-2', message: 'Fix typo in README', date: Date.now() - 3000000, hash: '5c3b2a', branch: 'main', parents: ['c-1'] },
          { id: 'c-1', message: 'Initial Commit', date: Date.now() - 4000000, hash: '4b2a1c', branch: 'main', parents: [] },
      ],
      branch: 'main'
  });

  // Layout State
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(320);
  const [isLeftSidebarVisible, setIsLeftSidebarVisible] = useState(true);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);

  // Layout Toggles
  const toggleLeftSidebar = () => setIsLeftSidebarVisible(!isLeftSidebarVisible);
  const toggleRightSidebar = () => setIsRightSidebarVisible(!isRightSidebarVisible);
  const toggleTerminal = () => setIsTerminalVisible(!isTerminalVisible);

  // Resizing Logic
  const startResizing = useCallback((direction: 'left' | 'right') => (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      const startX = mouseDownEvent.clientX;
      const startWidth = direction === 'left' ? leftWidth : rightWidth;

      const doDrag = (mouseMoveEvent: MouseEvent) => {
          if (direction === 'left') {
              const newWidth = startWidth + mouseMoveEvent.clientX - startX;
              setLeftWidth(Math.max(160, Math.min(newWidth, 600)));
          } else {
              const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
              setRightWidth(Math.max(240, Math.min(newWidth, 600)));
          }
      };

      const stopDrag = () => {
          document.removeEventListener('mousemove', doDrag);
          document.removeEventListener('mouseup', stopDrag);
          document.body.style.cursor = 'default';
          document.body.style.userSelect = 'auto';
      };

      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', stopDrag);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
  }, [leftWidth, rightWidth]);

  // Recursively find file by ID
  const findFile = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFile(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to get all descendant IDs of a node (including itself)
  const getSubtreeIds = (node: FileNode): string[] => {
      let ids = [node.id];
      if (node.children) {
          node.children.forEach(child => {
              ids = [...ids, ...getSubtreeIds(child)];
          });
      }
      return ids;
  };

  // Update content when active file changes
  useEffect(() => {
    if (activeFileId) {
      const file = findFile(files, activeFileId);
      if (file && file.type === 'file') {
        setActiveContent(file.content || '');
        setActiveLanguage(file.language || 'plaintext');
      }
    } else {
        setActiveContent('');
    }
  }, [activeFileId, files]);

  // --- Theme Management ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- Workspace Management ---
  const handleCreateWorkspace = () => {
      const name = window.prompt("Enter new workspace name:");
      if (!name) return;
      if (workspaces[name]) {
          alert("Workspace already exists!");
          return;
      }

      // Save current state before switching
      setWorkspaces(prev => ({ ...prev, [activeWorkspace]: history[historyIndex] }));
      
      const newRoot: FileNode[] = [{ 
          id: 'root', 
          name: name, 
          type: 'folder', 
          children: [
            { id: 'README.md', name: 'README.md', type: 'file', language: 'plaintext', content: `# ${name}\n\nNew workspace created.` }
          ] 
      }];

      setWorkspaces(prev => ({ ...prev, [name]: newRoot }));
      setActiveWorkspace(name);
      
      // Reset view
      setHistory([newRoot]);
      setHistoryIndex(0);
      setOpenFiles(['README.md']);
      setActiveFileId('README.md');
      setGitState({ modifiedFiles: [], stagedFiles: [], commits: [], branch: 'main' });
      setTerminalLines(prev => [...prev, { id: Date.now().toString(), type: 'success', content: `Created and switched to workspace: ${name}` }]);
      setOutputLines([]);
      setProblems([]);
  };

  const handleRenameWorkspace = () => {
      const newName = window.prompt("Rename workspace:", activeWorkspace);
      if (!newName || newName === activeWorkspace) return;
      if (workspaces[newName]) {
          alert("Workspace with this name already exists.");
          return;
      }

      const currentData = workspaces[activeWorkspace];
      const newWorkspaces = { ...workspaces };
      delete newWorkspaces[activeWorkspace];
      
      // Update the root folder name if it exists to match workspace name
      const updatedRoot = [...currentData];
      if (updatedRoot.length > 0 && updatedRoot[0].type === 'folder') {
          updatedRoot[0] = { ...updatedRoot[0], name: newName };
      }
      
      newWorkspaces[newName] = updatedRoot;
      
      setWorkspaces(newWorkspaces);
      setActiveWorkspace(newName);
      setHistory([updatedRoot]);
      setHistoryIndex(0);
      
      setTerminalLines(prev => [...prev, { id: Date.now().toString(), type: 'success', content: `Renamed workspace to: ${newName}` }]);
  };

  const handleSwitchWorkspace = (name: string) => {
      if (name === activeWorkspace) return;

      // Save current state
      setWorkspaces(prev => ({ ...prev, [activeWorkspace]: history[historyIndex] }));

      // Load new state
      const nextFiles = workspaces[name];
      if (!nextFiles) return;

      setActiveWorkspace(name);
      setHistory([nextFiles]);
      setHistoryIndex(0);
      setOpenFiles([]);
      setActiveFileId(null);
      setGitState({ modifiedFiles: [], stagedFiles: [], commits: [], branch: 'main' });
      setTerminalLines(prev => [...prev, { id: Date.now().toString(), type: 'info', content: `Switched to workspace: ${name}` }]);
      setOutputLines([]);
      setProblems([]);
  };

  const handleDownloadWorkspace = async () => {
    try {
        const zip = new JSZip();
        
        // Helper to recursively add files/folders to zip
        const processNode = (node: FileNode, folder: any) => {
            if (node.type === 'folder') {
                const newFolder = folder ? folder.folder(node.name) : zip.folder(node.name);
                if (node.children) {
                    node.children.forEach(child => processNode(child, newFolder));
                }
            } else {
                // File
                const content = node.content || '';
                if (folder) {
                    folder.file(node.name, content);
                } else {
                    zip.file(node.name, content);
                }
            }
        };

        // Start processing from root
        files.forEach(node => processNode(node, zip));

        // Generate zip
        const content = await zip.generateAsync({ type: "blob" });
        
        // Trigger download
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeWorkspace}.zip`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setTerminalLines(prev => [
            ...prev,
            { id: Date.now().toString(), type: 'success', content: `Workspace '${activeWorkspace}' downloaded successfully.` }
        ]);

    } catch (error) {
        console.error("Download failed:", error);
        setTerminalLines(prev => [
            ...prev,
            { id: Date.now().toString(), type: 'error', content: `Failed to download workspace: ${error}` }
        ]);
    }
  };

  // --- History Management ---

  const addToHistory = (newFiles: FileNode[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newFiles);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
      if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
      }
  };

  // --- Settings Management ---
  const handleUpdateSettings = (key: keyof ProjectSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleEditorChange = (value: string | undefined) => {
      if (value === undefined || !activeFileId) return;
      setActiveContent(value);
      
      const updateContentRecursive = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
              if (node.id === activeFileId) {
                  return { ...node, content: value };
              }
              if (node.children) {
                  return { ...node, children: updateContentRecursive(node.children) };
              }
              return node;
          });
      };

      const newFiles = updateContentRecursive(files);
      // Update in place for editing to prevent history spam
      setHistory(prev => {
          const newHist = [...prev];
          newHist[historyIndex] = newFiles;
          return newHist;
      });

      // Update Git modified status
      setGitState(prev => {
          if (!prev.modifiedFiles.includes(activeFileId) && !prev.stagedFiles.includes(activeFileId)) {
              return { ...prev, modifiedFiles: [...prev.modifiedFiles, activeFileId] };
          }
          return prev;
      });
  };
  
  const handleCompile = () => {
      if (!activeFileId) return;
      const file = findFile(files, activeFileId);
      const fileName = file ? file.name : activeFileId;

      setTerminalLines(prev => [
          ...prev,
          { id: Date.now().toString(), type: 'command', content: `cargo build --release -p ${fileName}` },
      ]);
      
      // Simulate Compiler Output
      setOutputLines([
          `> Compiling ${fileName}...`,
          `> Optimization: ${settings.enableOptimization ? 'Enabled' : 'Disabled'}`,
          `> Compiler starting...`
      ]);

      setProblems([]); // Clear previous problems

      setTimeout(() => {
          // Simulate randomized success/failure for demo purposes
          const hasError = Math.random() > 0.7;

          if (hasError) {
             setTerminalLines(prev => [
                  ...prev,
                  { id: Date.now().toString(), type: 'error', content: 'Compilation failed. See Output and Problems for details.' },
              ]);
             setOutputLines(prev => [...prev, `Error: Compilation failed with 1 error.`]);
             setProblems([{
                 id: Date.now().toString(),
                 file: fileName,
                 description: 'Identifier not found or not unique',
                 line: 12,
                 column: 4,
                 severity: 'error'
             }]);
             if (!isTerminalVisible) setIsTerminalVisible(true);
          } else {
             setTerminalLines(prev => [
                  ...prev,
                  { id: Date.now().toString(), type: 'success', content: 'Compilation successful!' },
              ]);
             setOutputLines(prev => [...prev, `> Compilation completed successfully.`]);
          }
      }, 1000);
  };

  // --- Git Operations ---

  const handleStageFile = (id: string) => {
      setGitState(prev => ({
          ...prev,
          modifiedFiles: prev.modifiedFiles.filter(f => f !== id),
          stagedFiles: [...prev.stagedFiles, id]
      }));
  };

  const handleUnstageFile = (id: string) => {
      setGitState(prev => ({
          ...prev,
          stagedFiles: prev.stagedFiles.filter(f => f !== id),
          modifiedFiles: [...prev.modifiedFiles, id]
      }));
  };

  const handleCommit = (message: string) => {
      setGitState(prev => {
          // Mocking parent as the most recent commit (linear history default for new commits)
          const parentId = prev.commits.length > 0 ? prev.commits[0].id : undefined;
          
          const newCommit: GitCommit = {
              id: Date.now().toString(),
              message,
              date: Date.now(),
              hash: Math.random().toString(16).substring(2, 8),
              branch: prev.branch,
              parents: parentId ? [parentId] : []
          };

          return {
              ...prev,
              stagedFiles: [],
              commits: [newCommit, ...prev.commits]
          };
      });
      setTerminalLines(prev => [
          ...prev,
          { id: Date.now().toString(), type: 'success', content: `Committed: ${message}` }
      ]);
  };

  const handlePush = () => {
      setTerminalLines(prev => [
          ...prev,
          { id: Date.now().toString(), type: 'info', content: 'Pushing to origin/main...' }
      ]);
      setTimeout(() => {
          setTerminalLines(prev => [
            ...prev,
            { id: Date.now().toString(), type: 'success', content: 'Push successful.' }
        ]);
      }, 1500);
  };

  const handleDeployView = () => {
      setActiveView(ActivityView.DEPLOY);
      if (!isLeftSidebarVisible) toggleLeftSidebar();
  };

  // --- Tab Management ---

  const handleFileOpen = (fileId: string) => {
      if (!openFiles.includes(fileId)) {
          setOpenFiles([...openFiles, fileId]);
      }
      setActiveFileId(fileId);
  };

  const handleTabClose = (fileId: string) => {
      const filtered = openFiles.filter(id => id !== fileId);
      setOpenFiles(filtered);
      
      if (activeFileId === fileId) {
          if (filtered.length > 0) {
              setActiveFileId(filtered[filtered.length - 1]);
          } else {
              setActiveFileId(null);
          }
      }
  };

  // --- File System Operations ---

  const handleCreateNode = (parentId: string, type: 'file' | 'folder', name: string) => {
      const newId = `${name}-${Date.now()}`;
      const extension = name.split('.').pop() || 'plaintext';
      const language = extension === 'sol' ? 'sol' : extension === 'rs' ? 'rust' : extension === 'ts' ? 'typescript' : extension === 'js' ? 'javascript' : 'plaintext';
      
      const newNode: FileNode = {
          id: newId,
          name: name,
          type: type,
          language: type === 'file' ? language : undefined,
          content: type === 'file' ? '' : undefined,
          children: type === 'folder' ? [] : undefined
      };

      const addNodeRecursive = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
              if (node.id === parentId && node.type === 'folder') {
                  return { ...node, children: [...(node.children || []), newNode], isOpen: true };
              }
              if (node.children) {
                  return { ...node, children: addNodeRecursive(node.children) };
              }
              return node;
          });
      };

      const newFiles = addNodeRecursive(files);
      addToHistory(newFiles);
      if (type === 'file') {
          handleFileOpen(newId);
          setGitState(prev => ({ ...prev, modifiedFiles: [...prev.modifiedFiles, newId] }));
      }
  };

  const handleRenameNode = (id: string, newName: string) => {
      const renameRecursive = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
              if (node.id === id) {
                  return { ...node, name: newName };
              }
              if (node.children) {
                  return { ...node, children: renameRecursive(node.children) };
              }
              return node;
          });
      };
      const newFiles = renameRecursive(files);
      addToHistory(newFiles);
  };

  const handleDeleteNode = (id: string) => {
      // 1. Find the node to delete to identify all children
      const nodeToDelete = findFile(files, id);
      if (!nodeToDelete) return;
      
      // 2. Get all IDs being deleted (including children)
      const idsToDelete = getSubtreeIds(nodeToDelete);
      
      // 3. Close relevant tabs
      const newOpenFiles = openFiles.filter(fileId => !idsToDelete.includes(fileId));
      setOpenFiles(newOpenFiles);
      
      // 4. Update active file if it was deleted
      if (activeFileId && idsToDelete.includes(activeFileId)) {
          setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
      }
      
      // 5. Remove from tree
      const deleteRecursive = (nodes: FileNode[]): FileNode[] => {
          return nodes
            .filter(node => node.id !== id)
            .map(node => {
                if (node.children) {
                    return { ...node, children: deleteRecursive(node.children) };
                }
                return node;
            });
      };
      
      const newFiles = deleteRecursive(files);
      addToHistory(newFiles);
      
      // Update Git
      setGitState(prev => ({
          ...prev,
          modifiedFiles: prev.modifiedFiles.filter(f => f !== id),
          stagedFiles: prev.stagedFiles.filter(f => f !== id)
      }));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-caspier-black text-caspier-text overflow-hidden font-sans">
        
        {/* Top Header */}
        <Header 
            currentWorkspace={activeWorkspace}
            workspaces={Object.keys(workspaces)}
            onSwitchWorkspace={handleSwitchWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            onRenameWorkspace={handleRenameWorkspace}
            onDownloadWorkspace={handleDownloadWorkspace}
            theme={theme}
            toggleTheme={toggleTheme}
            isLeftSidebarVisible={isLeftSidebarVisible}
            toggleLeftSidebar={toggleLeftSidebar}
            isRightSidebarVisible={isRightSidebarVisible}
            toggleRightSidebar={toggleRightSidebar}
            isTerminalVisible={isTerminalVisible}
            toggleTerminal={toggleTerminal}
        />

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
            <ActivityBar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                isSidebarVisible={isLeftSidebarVisible}
                onToggleSidebar={toggleLeftSidebar}
            />

            {isLeftSidebarVisible && (
                <>
                    <SidebarLeft 
                        files={files} 
                        activeFileId={activeFileId} 
                        onFileSelect={handleFileOpen} 
                        activeView={activeView}
                        onCreateNode={handleCreateNode}
                        onRenameNode={handleRenameNode}
                        onDeleteNode={handleDeleteNode}
                        width={leftWidth}
                        onUndo={undo}
                        onRedo={redo}
                        canUndo={historyIndex > 0}
                        canRedo={historyIndex < history.length - 1}
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                        gitState={gitState}
                        onStageFile={handleStageFile}
                        onUnstageFile={handleUnstageFile}
                        onCommit={handleCommit}
                        onPush={handlePush}
                    />
                    {/* Left Resizer */}
                    <div 
                        className="w-1 bg-caspier-dark hover:bg-caspier-red cursor-col-resize z-10 transition-colors delay-150"
                        onMouseDown={startResizing('left')}
                    />
                </>
            )}

            <div className="flex-1 flex flex-col min-w-0 bg-caspier-dark">
                {/* Editor Tabs & Header */}
                <EditorTabs 
                    files={files} 
                    openFileIds={openFiles} 
                    activeFileId={activeFileId} 
                    onSelect={setActiveFileId} 
                    onClose={handleTabClose} 
                />

                <div className="h-9 flex items-center bg-caspier-black border-b border-caspier-border px-4 justify-between flex-shrink-0">
                   <div className="flex items-center text-sm">
                        <span className="text-caspier-muted text-xs mr-2">{activeFileId ? findFile(files, activeFileId)?.name : ''}</span>
                   </div>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={handleCompile} 
                            className="flex gap-2 items-center !py-1 shadow-none active:shadow-none translate-x-[0px] translate-y-[0px] active:translate-x-[0px] active:translate-y-[0px]"
                        >
                             <PlayIcon className="w-3 h-3" />
                             <span>Compile</span>
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={handleDeployView} 
                            className="flex gap-2 items-center !py-1 shadow-none active:shadow-none translate-x-[0px] translate-y-[0px] active:translate-x-[0px] active:translate-y-[0px]"
                        >
                             <RocketIcon className="w-3 h-3" />
                             <span>Deploy</span>
                        </Button>
                        {!isRightSidebarVisible && (
                            <button 
                                onClick={toggleRightSidebar} 
                                className="text-caspier-muted hover:text-caspier-text p-1 ml-2 border border-transparent hover:border-caspier-border rounded"
                                title="Open AI Assistant"
                            >
                                <BotIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 relative min-h-0">
                    <CodeEditor 
                        code={activeContent} 
                        language={activeLanguage} 
                        onChange={handleEditorChange} 
                        settings={settings}
                        theme={theme}
                    />
                </div>

                {isTerminalVisible && (
                    <TerminalPanel 
                        terminalLines={terminalLines} 
                        outputLines={outputLines} 
                        problems={problems}
                        height={200} 
                    />
                )}
            </div>

            {isRightSidebarVisible && (
                <>
                     {/* Right Resizer */}
                     <div 
                        className="w-1 bg-caspier-dark hover:bg-caspier-red cursor-col-resize z-10 transition-colors delay-150"
                        onMouseDown={startResizing('right')}
                    />
                    <SidebarRight 
                        currentCode={activeContent} 
                        files={files}
                        width={rightWidth} 
                        onClose={toggleRightSidebar}
                    />
                </>
            )}
        </div>
        
        {/* Status Bar */}
        <div className="h-6 bg-caspier-red text-caspier-black flex justify-between items-center px-3 text-xs font-bold select-none flex-shrink-0">
            <div className="flex gap-4">
                <span>{gitState.branch}*</span>
                <span>{problems.length} problems</span>
            </div>
            <div className="flex gap-4">
                 <span>Ln 12, Col 4</span>
                 <span>UTF-8</span>
                 <span>{activeLanguage.toUpperCase()}</span>
                 <span>Caspier v1.2.0</span>
            </div>
        </div>
    </div>
  );
}

export default App;