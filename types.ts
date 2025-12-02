

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // Only for files
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface FileSystemState {
  root: FileNode[];
  activeFileId: string | null;
  expandedFolders: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum ActivityView {
  EXPLORER = 'EXPLORER',
  SEARCH = 'SEARCH',
  GIT = 'GIT',
  DEPLOY = 'DEPLOY',
  DEBUG = 'DEBUG',
  EXTENSIONS = 'EXTENSIONS',
  SETTINGS = 'SETTINGS'
}

export interface TerminalLine {
  id: string;
  type: 'info' | 'error' | 'success' | 'command';
  content: string;
}

export interface Problem {
    id: string;
    file: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    line: number;
    column: number;
}

export interface ProjectSettings {
  // Editor
  fontSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  tabSize: number;
  // Compiler
  autoCompile: boolean;
  enableOptimization: boolean;
  evmVersion: 'cancun' | 'shanghai' | 'paris';
}

export interface GitCommit {
  id: string;
  message: string;
  date: number;
  hash?: string;
  branch?: string;
  parents?: string[]; // IDs of parent commits
}

export interface GitState {
    modifiedFiles: string[];
    stagedFiles: string[];
    commits: GitCommit[];
    branch: string;
}