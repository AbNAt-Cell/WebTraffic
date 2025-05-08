import { useState } from "react";
import VisitForm from "@/components/VisitForm";
import CommandHelp from "@/components/CommandHelp";
import BrowserView from "@/components/BrowserView";
import ActivityLog from "@/components/ActivityLog";
import SettingsModal from "@/components/SettingsModal";
import ExtractedDataModal from "@/components/ExtractedDataModal";
import AIAssistant from "@/components/AIAssistant";
import VisitScheduler from "@/components/VisitScheduler";
import { useAgent } from "@/hooks/use-agent";
import { ExtractedDataItem } from "@/types";
import { useMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExtractedDataOpen, setIsExtractedDataOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDataItem[]>([]);
  
  const { 
    status, 
    currentUrl, 
    activityLogs, 
    executeCommand, 
    loadingState, 
    handleExtractedData
  } = useAgent((data) => {
    setExtractedData(data);
    setIsExtractedDataOpen(true);
  });

  // Check if we're on mobile to adapt the layout
  const isMobile = useMobile();
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl">
              <rect width="18" height="10" x="3" y="11" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
            </svg>
            <h1 className="text-xl font-medium">WebAgent</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 animate-pulse ${
                status === 'error' ? 'bg-[#D32F2F]' : 
                status === 'busy' ? 'bg-[#FFC107]' : 
                'bg-[#4CAF50]'
              }`}></span>
              <span>{
                status === 'error' ? 'Error' : 
                status === 'busy' ? 'Busy' : 
                'Active'
              }</span>
            </div>
            
            <button 
              className="flex items-center bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm transition"
              onClick={() => setIsSettingsOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left Panel - Visit Interface */}
        <div className="flex flex-col lg:col-span-3 h-full gap-4">
          <VisitForm
            currentUrl={currentUrl}
            onExecute={executeCommand}
          />
          
          <CommandHelp 
            onSelectCommand={(cmd) => {
              executeCommand(cmd);
            }}
          />
          
          {/* AI Assistant (only visible on desktop) */}
          {!isMobile && (
            <div className="h-full">
              <AIAssistant 
                currentUrl={currentUrl}
                onSuggestedCommand={executeCommand}
              />
            </div>
          )}
        </div>
        
        {/* Middle Panel - Browser View */}
        <div className="flex flex-col lg:col-span-6 h-full">
          <BrowserView 
            url={currentUrl} 
            loading={loadingState.isLoading}
            loadingMessage={loadingState.message}
          />
        </div>
        
        {/* Right Panel - Activity Log, Visit Scheduler, and AI Assistant (on mobile) */}
        <div className="flex flex-col lg:col-span-3 h-full gap-4">
          <ActivityLog logs={activityLogs} />
          
          {/* Visit Scheduler */}
          <div className="flex-1">
            <VisitScheduler currentUrl={currentUrl} />
          </div>
          
          {/* AI Assistant (only visible on mobile) */}
          {isMobile && (
            <div className="h-48">
              <AIAssistant 
                currentUrl={currentUrl}
                onSuggestedCommand={executeCommand}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      <ExtractedDataModal 
        isOpen={isExtractedDataOpen} 
        onClose={() => setIsExtractedDataOpen(false)}
        data={extractedData}
      />
    </div>
  );
}
