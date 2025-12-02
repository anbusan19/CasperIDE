
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { generateChatResponse } from '../../services/geminiService';
import { ChatMessage, FileNode } from '../../types';
import { Button } from '../UI/Button';
import { BotIcon, SendIcon, XIcon, SmartFileIcon, CheckIcon } from '../UI/Icons';

interface SidebarRightProps {
  currentCode: string;
  files: FileNode[];
  width: number;
  onClose: () => void;
}

interface CodeBlockProps {
    language?: string;
    content: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, content }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 rounded-md border border-caspier-border bg-caspier-dark overflow-hidden w-full">
            <div className="flex justify-between items-center px-3 py-1.5 bg-caspier-black border-b border-caspier-border">
                <span className="text-xs text-caspier-muted font-mono lowercase">{language || 'code'}</span>
                <button 
                    onClick={handleCopy}
                    className="text-xs text-caspier-muted hover:text-caspier-text flex items-center gap-1 transition-colors"
                >
                    {copied ? <CheckIcon className="w-3 h-3 text-green-500" /> : null}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="p-3 overflow-x-auto bg-[#0d0d0d]">
                <pre className="text-xs font-mono text-caspier-text leading-relaxed tab-[2]">
                    {content.trim()}
                </pre>
            </div>
        </div>
    );
};

const SidebarRight: React.FC<SidebarRightProps> = ({ currentCode, files, width, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: 'welcome',
        role: 'model',
        text: 'Hello! I am Caspier AI. You can mention files using @filename to ask me to review them or find errors. How can I assist you today?',
        timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [filteredFiles, setFilteredFiles] = useState<FileNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Flatten files helper
  const getAllFiles = useMemo(() => {
      const flatten = (nodes: FileNode[]): FileNode[] => {
          let result: FileNode[] = [];
          nodes.forEach(node => {
              if (node.type === 'file') result.push(node);
              if (node.children) result = [...result, ...flatten(node.children)];
          });
          return result;
      };
      return flatten(files);
  }, [files]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInput(val);

      // Simple mention detection: check if the word being typed starts with @
      const cursor = e.target.selectionStart || val.length;
      const textBeforeCursor = val.slice(0, cursor);
      const words = textBeforeCursor.split(/\s+/);
      const currentWord = words[words.length - 1];

      if (currentWord.startsWith('@')) {
          const query = currentWord.slice(1).toLowerCase();
          setMentionQuery(query);
          
          const filtered = getAllFiles.filter(f => f.name.toLowerCase().includes(query));
          setFilteredFiles(filtered);
          setSelectedIndex(0);
      } else {
          setMentionQuery(null);
      }
  };

  const insertMention = (fileName: string) => {
      if (!inputRef.current) return;
      
      const cursor = inputRef.current.selectionStart || input.length;
      const textBeforeCursor = input.slice(0, cursor);
      const textAfterCursor = input.slice(cursor);
      
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      if (lastAtIndex !== -1) {
          const newText = textBeforeCursor.substring(0, lastAtIndex) + `@${fileName} ` + textAfterCursor;
          setInput(newText);
          setMentionQuery(null);
          inputRef.current.focus();
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (mentionQuery !== null && filteredFiles.length > 0) {
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedIndex(prev => (prev + 1) % filteredFiles.length);
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
          } else if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              insertMention(filteredFiles[selectedIndex].name);
          } else if (e.key === 'Escape') {
              setMentionQuery(null);
          }
      } else if (e.key === 'Enter') {
          handleSend();
      }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Identify mentions in the final input
    // Regex matches @filename words
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const matches = Array.from(input.matchAll(mentionRegex));
    
    let contextPayload = `Active File (Currently Open):\n${currentCode}\n\n`;
    
    if (matches.length > 0) {
        contextPayload += "Referenced Files:\n";
        matches.forEach(match => {
            const fileName = match[1];
            const fileNode = getAllFiles.find(f => f.name === fileName);
            if (fileNode && fileNode.content) {
                contextPayload += `--- START OF FILE ${fileName} ---\n${fileNode.content}\n--- END OF FILE ---\n\n`;
            }
        });
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setMentionQuery(null);
    setLoading(true);

    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const responseText = await generateChatResponse(userMsg.text, contextPayload, history);
    
    if (responseText.includes("API Key is missing")) {
        setApiKeyMissing(true);
    }

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const formatInlineText = (text: string) => {
      // Regex for Bold (**text**), Inline Code (`text`), and Mentions (@file)
      const regex = /(\*\*[^*]+\*\*)|(`[^`]+`)|(@[a-zA-Z0-9_.-]+)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
              parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
          }
          
          const str = match[0];
          if (str.startsWith('**')) {
              parts.push({ type: 'bold', content: str.slice(2, -2) });
          } else if (str.startsWith('`')) {
              parts.push({ type: 'inline-code', content: str.slice(1, -1) });
          } else if (str.startsWith('@')) {
              parts.push({ type: 'mention', content: str.slice(1) });
          }
          
          lastIndex = match.index + str.length;
      }
      if (lastIndex < text.length) {
          parts.push({ type: 'text', content: text.slice(lastIndex) });
      }

      return parts.map((part, i) => {
          if (part.type === 'bold') return <strong key={i} className="text-caspier-text font-bold">{part.content}</strong>;
          if (part.type === 'inline-code') return <code key={i} className="bg-caspier-hover px-1.5 py-0.5 rounded text-caspier-red font-mono text-xs border border-caspier-border">{part.content}</code>;
          if (part.type === 'mention') {
               const file = getAllFiles.find(f => f.name === part.content);
               if (file) {
                    return (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1 text-caspier-red bg-caspier-red/10 px-1.5 py-0.5 rounded border border-caspier-red/20 text-xs font-bold mx-0.5 align-baseline transform translate-y-[1px]"
                          title={`File: ${part.content}`}
                        >
                          <SmartFileIcon name={part.content} className="w-3 h-3" />
                          {part.content}
                        </span>
                    );
               }
               return <span key={i} className="text-caspier-red">@{part.content}</span>;
          }
          return <span key={i}>{part.content}</span>;
      });
  };

  const renderMessageContent = (text: string) => {
    // 1. Split code blocks
    // Regex matches ```language (optional) \n code ```
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    
    interface MessagePart {
        type: 'text' | 'code';
        content: string;
        language?: string;
    }
    const parts: MessagePart[] = [];
    
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'code', language: match[1], content: match[2] });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.map((part, index) => {
        if (part.type === 'code') {
            return <CodeBlock key={index} language={part.language} content={part.content} />;
        }
        return (
            <div key={index} className="whitespace-pre-wrap leading-relaxed">
                {formatInlineText(part.content)}
            </div>
        );
    });
  };

  return (
    <div style={{ width }} className="flex-shrink-0 bg-caspier-dark border-l border-caspier-border flex flex-col h-full relative">
      <div className="p-3 border-b border-caspier-border flex items-center justify-between bg-caspier-black">
        <div className="flex items-center gap-2">
            <BotIcon className="text-caspier-red w-5 h-5" />
            <span className="text-xs font-bold text-caspier-text tracking-wider">CASPIER ASSISTANT</span>
        </div>
        <button onClick={onClose} className="text-caspier-muted hover:text-caspier-text">
            <XIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              max-w-[95%] p-3 rounded-sm text-sm border 
              ${msg.role === 'user' 
                ? 'bg-caspier-panel border-caspier-red/50 text-caspier-text' 
                : 'bg-caspier-black border-caspier-border text-caspier-text w-full'}
            `}>
              {renderMessageContent(msg.text)}
            </div>
            <span className="text-[10px] text-caspier-muted mt-1 uppercase">
                {msg.role === 'user' ? 'You' : 'Caspier AI'}
            </span>
          </div>
        ))}
        {loading && (
             <div className="flex items-start">
                 <div className="bg-caspier-black border border-caspier-border p-3 text-xs text-caspier-red animate-pulse">
                     Thinking...
                 </div>
             </div>
        )}
        {apiKeyMissing && (
            <div className="p-2 border border-red-900 bg-red-900/10 text-red-400 text-xs">
                To use the AI, you must provide a GEMINI_API_KEY environment variable.
            </div>
        )}
      </div>

      <div className="p-3 border-t border-caspier-border bg-caspier-black relative">
        {/* Mention Popup */}
        {mentionQuery !== null && filteredFiles.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-caspier-black border border-caspier-border shadow-xl max-h-40 overflow-y-auto z-50 rounded-sm">
                <div className="text-[10px] text-caspier-muted px-2 py-1 border-b border-caspier-border bg-caspier-panel uppercase font-bold">Suggested Files</div>
                {filteredFiles.map((file, idx) => (
                    <div 
                        key={file.id}
                        className={`px-3 py-2 text-sm flex items-center gap-2 cursor-pointer ${idx === selectedIndex ? 'bg-caspier-red text-caspier-black font-bold' : 'text-caspier-text hover:bg-caspier-hover'}`}
                        onClick={() => insertMention(file.name)}
                    >
                        <SmartFileIcon name={file.name} className="w-3 h-3" />
                        <span>{file.name}</span>
                    </div>
                ))}
            </div>
        )}

        <div className="flex gap-2 relative">
          <input 
            ref={inputRef}
            type="text" 
            className="flex-1 bg-caspier-panel border border-caspier-border text-caspier-text text-sm px-3 py-2 focus:outline-none focus:border-caspier-red placeholder-caspier-muted"
            placeholder="Ask anything (use @ to mention files)..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="off"
          />
          <Button variant="primary" size="sm" onClick={handleSend} disabled={loading} className="px-3">
             <SendIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SidebarRight;
