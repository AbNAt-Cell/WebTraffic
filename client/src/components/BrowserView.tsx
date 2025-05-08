import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface BrowserViewProps {
  url: string;
  loading: boolean;
  loadingMessage?: string;
}

interface InteractionIndicator {
  id: string;
  type: 'click' | 'type' | 'scroll';
  top: number;
  left: number;
  message?: string;
}

const BrowserView = ({ url, loading, loadingMessage = "Loading page..." }: BrowserViewProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactions, setInteractions] = useState<InteractionIndicator[]>([]);
  const browserRef = useRef<HTMLDivElement>(null);
  
  const addInteraction = (interaction: Omit<InteractionIndicator, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setInteractions(prev => [...prev, { ...interaction, id }]);
    
    // Remove the interaction after animation
    setTimeout(() => {
      setInteractions(prev => prev.filter(item => item.id !== id));
    }, 2000);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const refreshPage = () => {
    // This would be replaced with actual refresh functionality
    console.log("Refreshing page...");
  };
  
  useEffect(() => {
    // This is just for demonstration, in a real app we would
    // interact with the browser API or backend to show actual interactions
    if (url && !loading) {
      // Simulated click interaction
      setTimeout(() => {
        if (browserRef.current) {
          const bounds = browserRef.current.getBoundingClientRect();
          addInteraction({
            type: 'click',
            top: bounds.height * 0.4,
            left: bounds.width * 0.5
          });
        }
      }, 1000);
    }
  }, [url, loading]);
  
  return (
    <Card className={`flex-1 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="bg-secondary px-4 py-2 text-white text-sm font-medium flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span>Browser View</span>
          <span className="font-mono text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
            {url || "No URL loaded"}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            className="text-white opacity-70 hover:opacity-100"
            onClick={refreshPage}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
          <button 
            className="text-white opacity-70 hover:opacity-100"
            onClick={toggleFullscreen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="relative w-full" style={{ height: "500px" }}>
        {/* Browser visualization area */}
        <div 
          ref={browserRef}
          className="w-full h-full overflow-hidden bg-gray-100 flex items-center justify-center"
        >
          {!url ? (
            <div className="text-center p-4">
              <p className="text-gray-500">Enter a URL in the command terminal to start browsing</p>
            </div>
          ) : (
            <div className="text-center p-4 w-full">
              <div className="w-full border-t border-b border-gray-300 p-4 bg-white mx-auto max-w-4xl">
                <div className="w-1/2 h-8 bg-gray-200 rounded-lg mb-4"></div>
                <div className="flex space-x-4 mb-4">
                  <div className="w-32 h-32 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-full h-6 bg-gray-200 rounded"></div>
                    <div className="w-2/3 h-6 bg-gray-200 rounded"></div>
                    <div className="w-5/6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Interaction indicators */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {interactions.map(interaction => {
              if (interaction.type === 'click') {
                return (
                  <div 
                    key={interaction.id}
                    className="click-indicator"
                    style={{ 
                      top: `${interaction.top}px`, 
                      left: `${interaction.left}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M9 11V8a3 3 0 0 1 6 0v3" />
                      <path d="M12 12h3a3 3 0 0 1 0 6h-.3" />
                      <path d="m8 18-2 2" />
                      <path d="M2 12h1" />
                      <path d="M14 2c1.2.1 2 .4 2 2" />
                      <path d="M8 2c-1.2.1-2 .4-2 2" />
                    </svg>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-secondary">{loadingMessage}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BrowserView;
