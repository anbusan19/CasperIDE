import { FileNode } from '../types';
import { helloWorldRustExample } from '../examples/hello-world-rust';
import { upgradeableCounterV1 } from '../examples/upgradeable-counter-v1';
import { upgradeableCounterV2 } from '../examples/upgradeable-counter-v2';

export interface Template {
  id: string;
  name: string;
  description: string;
  language: 'rust' | 'assemblyscript';
  files: Record<string, string>;
}

export const TEMPLATES: Template[] = [
  {
    id: 'simple-counter',
    name: 'Simple Counter',
    description: 'A basic counter contract that initializes to 0 - no arguments required',
    language: 'rust',
    files: helloWorldRustExample
  },
  {
    id: 'upgradeable-counter-v1',
    name: 'Upgradeable Counter V1',
    description: 'Initial version of upgradeable counter - saves Access URef for future upgrades',
    language: 'rust',
    files: upgradeableCounterV1
  },
  {
    id: 'upgradeable-counter-v2',
    name: 'Upgradeable Counter V2',
    description: 'Upgrade example - adds decrement & reset features to existing contract',
    language: 'rust',
    files: upgradeableCounterV2
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










