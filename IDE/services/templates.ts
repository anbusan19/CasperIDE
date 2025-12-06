import { FileNode } from '../types';
import { counterRustExample } from '../examples/counter-rust';
import { ftAssemblyScriptExample } from '../examples/ft-assemblyscript';
import { helloWorldRustExample } from '../examples/hello-world-rust';

export interface Template {
  id: string;
  name: string;
  description: string;
  language: 'rust' | 'assemblyscript';
  files: Record<string, string>;
}

export const TEMPLATES: Template[] = [
  {
    id: 'hello-world-rust',
    name: 'Hello World (Rust)',
    description: 'A simple hello world contract that stores and retrieves a message',
    language: 'rust',
    files: helloWorldRustExample
  },
  {
    id: 'counter-rust',
    name: 'Counter (Rust)',
    description: 'A simple counter contract with increment, decrement, and get functions',
    language: 'rust',
    files: counterRustExample
  },
  {
    id: 'ft-assemblyscript',
    name: 'Fungible Token (AssemblyScript)',
    description: 'A basic fungible token contract with transfer, balance, and approval functions',
    language: 'assemblyscript',
    files: ftAssemblyScriptExample
  }
];

/**
 * Convert template files to FileNode structure
 */
export function templateToFileNodes(template: Template, parentId: string = 'root'): FileNode[] {
  const nodes: FileNode[] = [];
  const fileMap: Record<string, FileNode> = {};

  // Process each file in the template
  for (const [path, content] of Object.entries(template.files)) {
    const parts = path.split('/');
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (!fileMap[currentPath]) {
        const isFile = i === parts.length - 1;
        const extension = isFile ? part.split('.').pop()?.toLowerCase() : undefined;
        const language = isFile ? getLanguageFromExtension(extension || '') : undefined;
        
        const node: FileNode = {
          id: `${parentId}-${currentPath}`,
          name: part,
          type: isFile ? 'file' : 'folder',
          content: isFile ? content : undefined,
          language,
          children: isFile ? undefined : []
        };
        
        fileMap[currentPath] = node;
        
        // Add to parent
        if (i === 0) {
          nodes.push(node);
        } else {
          const parentPath = parts.slice(0, i).join('/');
          const parent = fileMap[parentPath];
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }
    }
  }

  return nodes;
}

function getLanguageFromExtension(ext: string): string {
  const langMap: Record<string, string> = {
    'rs': 'rust',
    'ts': 'typescript',
    'as': 'typescript',
    'toml': 'toml',
    'json': 'json',
    'md': 'markdown',
    'txt': 'plaintext',
    'makefile': 'makefile'
  };
  return langMap[ext] || 'plaintext';
}

/**
 * Load a template by ID
 */
export function loadTemplate(templateId: string): Template | null {
  return TEMPLATES.find(t => t.id === templateId) || null;
}










