import { useState, useRef, useEffect } from "react";

interface CommandTerminalProps {
  onSubmit: (command: string) => void;
}

const CommandTerminal = ({ onSubmit }: CommandTerminalProps) => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([
    "> WebAgent v1.0 initialized",
    "> Type 'help' for available commands",
    "> Ready for instructions..."
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const addToTerminal = (message: string, type: 'command' | 'success' | 'error' | 'info' = 'command') => {
    let className = '';
    
    switch (type) {
      case 'error':
        className = 'text-red-400';
        break;
      case 'success':
        className = 'text-green-400';
        break;
      case 'info':
        className = 'text-blue-400';
        break;
      default:
        className = '';
    }
    
    setHistory(prev => [...prev, `<span class="${className}">${message}</span>`]);
  };
  
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add command to terminal
    addToTerminal(`> ${command}`);
    
    // Add to command history
    setCommandHistory(prev => [...prev, command]);
    
    // Submit command
    onSubmit(command);
    
    // Reset input and history navigation
    setCommand("");
    setHistoryIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      // Navigate up through command history
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 
          ? historyIndex + 1 
          : historyIndex;
        
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      // Navigate down through command history
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };
  
  const clearTerminal = () => {
    setHistory([
      "> Terminal cleared",
      "> WebAgent v1.0 initialized",
      "> Type 'help' for available commands",
      "> Ready for instructions..."
    ]);
  };
  
  useEffect(() => {
    // Scroll to bottom when history changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    
    // Focus the input whenever possible
    inputRef.current?.focus();
  }, [history]);
  
  return (
    <div className="flex flex-col h-1/2 lg:h-3/5 bg-[#1E1E1E] rounded-lg shadow-lg overflow-hidden">
      <div className="bg-secondary px-4 py-2 text-white text-sm font-medium flex justify-between items-center">
        <span>Command Terminal</span>
        <div className="flex space-x-2">
          <button 
            className="text-white opacity-70 hover:opacity-100"
            onClick={clearTerminal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
          <button className="text-white opacity-70 hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        ref={terminalRef}
        className="terminal-output"
        dangerouslySetInnerHTML={{ __html: history.join('<br>') }}
      />
      
      <form 
        onSubmit={handleCommandSubmit}
        className="p-3 border-t border-gray-700 flex items-center bg-[#1E1E1E] bg-opacity-5"
      >
        <span className="text-green-400 mr-2">{'>'}</span>
        <input 
          ref={inputRef}
          type="text" 
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-[#E0E0E0] font-mono text-sm"
          placeholder="Enter command (e.g., navigate https://example.com)"
          autoComplete="off"
          spellCheck="false"
        />
      </form>
    </div>
  );
};

export default CommandTerminal;
