import { FileNode } from '../types';
import { helloWorldRustExample } from '../examples/hello-world-rust';
import { upgradeableCounterV1 } from '../examples/upgradeable-counter-v1';
import { upgradeableCounterV2 } from '../examples/upgradeable-counter-v2';
import { upgradeableCounterV3 } from '../examples/upgradeable-counter-v3';
import { storageBoxV1 } from '../examples/storage-box-v1';
import { storageBoxV2 } from '../examples/storage-box-v2';
import { storageBoxV3 } from '../examples/storage-box-v3';

export interface Template {
  id: string;
  name: string;
  description: string;
  language: 'rust' | 'assemblyscript';
  files: Record<string, string>;
}

export const TEMPLATES: Template[] = [
  // === BASIC CONTRACTS ===
  {
    id: 'simple-counter',
    name: '📦 Simple Counter',
    description: 'A basic counter contract that initializes to 0 - no arguments required',
    language: 'rust',
    files: helloWorldRustExample
  },

  // === EXAMPLE 1: Counter (Upgradeable) ===
  {
    id: 'upgradeable-counter-v1',
    name: '🔄 Counter V1 (Fresh Deploy)',
    description: 'First deploy - creates upgradeable package with increment/get_count',
    language: 'rust',
    files: upgradeableCounterV1
  },
  {
    id: 'upgradeable-counter-v2',
    name: '🔄 Counter V2 (Upgrade)',
    description: 'Upgrade - adds decrement & reset to existing counter package',
    language: 'rust',
    files: upgradeableCounterV2
  },
  {
    id: 'upgradeable-counter-v3',
    name: '🔄 Counter V3 (Upgrade)',
    description: 'Upgrade - adds set_value & multiply with parameters',
    language: 'rust',
    files: upgradeableCounterV3
  },

  // === EXAMPLE 2: Storage Box (Upgradeable) ===
  {
    id: 'storage-box-v1',
    name: '📋 Storage Box V1 (Fresh Deploy)',
    description: 'Different package - stores strings with store/get_value',
    language: 'rust',
    files: storageBoxV1
  },
  {
    id: 'storage-box-v2',
    name: '📋 Storage Box V2 (Upgrade)',
    description: 'Upgrade - adds append & clear to storage box package',
    language: 'rust',
    files: storageBoxV2
  },
  {
    id: 'storage-box-v3',
    name: '📋 Storage Box V3 (Upgrade)',
    description: 'Upgrade - adds get_length & replace with parameters',
    language: 'rust',
    files: storageBoxV3
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










