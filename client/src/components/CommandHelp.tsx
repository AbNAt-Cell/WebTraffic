import { useState } from "react";
import { Card } from "@/components/ui/card";

interface CommandHelpProps {
  onSelectCommand: (command: string) => void;
}

// Quick command suggestions
const QUICK_COMMANDS = [
  "navigate https://example.com",
  "click .submit-button",
  "extract .article-content",
  "type #search-input search term",
  "scroll down"
];

// Command reference
const COMMAND_REFERENCE = [
  { command: "navigate [url]", description: "Navigate to specified website" },
  { command: "click [selector]", description: "Click on an element" },
  { command: "type [selector] [text]", description: "Enter text into a form field" },
  { command: "extract [selector]", description: "Extract content from elements" },
  { command: "scroll [direction]", description: "Scroll page (up/down/top/bottom)" },
  { command: "help", description: "Show available commands" }
];

const CommandHelp = ({ onSelectCommand }: CommandHelpProps) => {
  const [isHelpExpanded, setIsHelpExpanded] = useState(true);
  
  return (
    <Card className="mt-4 flex-1 overflow-hidden">
      <div className="bg-secondary px-4 py-2 text-white text-sm font-medium flex justify-between items-center">
        <span>Command Help</span>
        <div className="flex space-x-2">
          <button 
            className="text-white opacity-70 hover:opacity-100"
            onClick={() => setIsHelpExpanded(!isHelpExpanded)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>
        </div>
      </div>
      
      {isHelpExpanded && (
        <div className="p-4 overflow-y-auto h-full max-h-64">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-secondary mb-2">Quick Commands</h3>
            {QUICK_COMMANDS.map((cmd, index) => (
              <div 
                key={index} 
                className="command-item"
              >
                <span className="font-mono">{cmd}</span>
                <button 
                  className="text-primary"
                  onClick={() => onSelectCommand(cmd)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-secondary mb-2">Command Reference</h3>
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Command</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {COMMAND_REFERENCE.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 font-mono">{item.command}</td>
                      <td className="px-3 py-2">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CommandHelp;
