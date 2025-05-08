import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ActivityLogItem, ExtractedDataItem } from "@/types";
import { useQuery } from "@tanstack/react-query";

type AgentStatus = "idle" | "busy" | "error";

// Format for the extraction data callback
type ExtractedDataCallback = (data: ExtractedDataItem[]) => void;

export function useAgent(onExtraction: ExtractedDataCallback) {
  const { toast } = useToast();
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: "Loading..."
  });

  // Fetch initial activity logs
  const { data: initialLogs } = useQuery({
    queryKey: ['/api/activity-logs'],
    enabled: true
  });

  // Update activity logs when they're fetched
  useEffect(() => {
    if (initialLogs) {
      setActivityLogs(initialLogs);
    }
  }, [initialLogs]);

  // Process command input and execute the appropriate action
  const executeCommand = useCallback(async (command: string) => {
    const parts = command.split(' ');
    const action = parts[0].toLowerCase();
    
    try {
      setStatus("busy");
      
      switch (action) {
        case 'navigate':
          if (parts.length < 2) {
            throw new Error("URL required for navigation");
          }
          
          const url = parts[1];
          setLoadingState({
            isLoading: true,
            message: `Navigating to ${url}...`
          });
          
          const navigationResult = await apiRequest("POST", "/api/navigate", { url });
          const navData = await navigationResult.json();
          
          if (navData.success) {
            setCurrentUrl(url);
            addActivityLog({
              activityType: "navigation",
              description: `Successfully navigated to ${url}`,
              timestamp: new Date()
            });
            
            toast({
              title: "Navigation successful",
              description: `Loaded ${url}`,
            });
          } else {
            throw new Error(navData.error || "Navigation failed");
          }
          break;
          
        case 'click':
          if (parts.length < 2) {
            throw new Error("Selector required for clicking");
          }
          
          if (!currentUrl) {
            throw new Error("You need to navigate to a URL first");
          }
          
          const selector = parts.slice(1).join(' ');
          setLoadingState({
            isLoading: true,
            message: `Clicking element: ${selector}...`
          });
          
          const clickResult = await apiRequest("POST", "/api/click", { 
            url: currentUrl,
            selector 
          });
          const clickData = await clickResult.json();
          
          if (clickData.success) {
            addActivityLog({
              activityType: "interaction",
              description: `Clicked on element: ${selector}`,
              timestamp: new Date()
            });
            
            toast({
              title: "Click successful",
              description: `Clicked element: ${selector}`,
            });
          } else {
            throw new Error(clickData.error || "Click failed");
          }
          break;
          
        case 'type':
          if (parts.length < 3) {
            throw new Error("Selector and text required for typing");
          }
          
          if (!currentUrl) {
            throw new Error("You need to navigate to a URL first");
          }
          
          const typeSelector = parts[1];
          const text = parts.slice(2).join(' ');
          setLoadingState({
            isLoading: true,
            message: `Typing into element: ${typeSelector}...`
          });
          
          const typeResult = await apiRequest("POST", "/api/type", { 
            url: currentUrl,
            selector: typeSelector,
            text 
          });
          const typeData = await typeResult.json();
          
          if (typeData.success) {
            addActivityLog({
              activityType: "interaction",
              description: `Typed "${text}" into element: ${typeSelector}`,
              timestamp: new Date()
            });
            
            toast({
              title: "Input successful",
              description: `Typed text into: ${typeSelector}`,
            });
          } else {
            throw new Error(typeData.error || "Type action failed");
          }
          break;
          
        case 'extract':
          if (parts.length < 2) {
            throw new Error("Selector required for extraction");
          }
          
          if (!currentUrl) {
            throw new Error("You need to navigate to a URL first");
          }
          
          const extractSelector = parts.slice(1).join(' ');
          setLoadingState({
            isLoading: true,
            message: `Extracting data from: ${extractSelector}...`
          });
          
          const extractResult = await apiRequest("POST", "/api/extract", { 
            url: currentUrl,
            selector: extractSelector
          });
          const extractData = await extractResult.json();
          
          if (extractData.success) {
            addActivityLog({
              activityType: "extraction",
              description: `Extracted ${extractData.count} items from: ${extractSelector}`,
              timestamp: new Date()
            });
            
            toast({
              title: "Extraction successful",
              description: `Found ${extractData.count} items`,
            });
            
            // Pass the extracted data to the callback
            onExtraction(extractData.data);
          } else {
            throw new Error(extractData.error || "Extraction failed");
          }
          break;
          
        case 'scroll':
          if (parts.length < 2) {
            throw new Error("Direction required for scrolling");
          }
          
          if (!currentUrl) {
            throw new Error("You need to navigate to a URL first");
          }
          
          const direction = parts[1].toLowerCase();
          if (!['up', 'down', 'top', 'bottom'].includes(direction)) {
            throw new Error("Invalid scroll direction. Use: up, down, top, or bottom");
          }
          
          setLoadingState({
            isLoading: true,
            message: `Scrolling ${direction}...`
          });
          
          const scrollResult = await apiRequest("POST", "/api/scroll", { 
            url: currentUrl,
            direction
          });
          const scrollData = await scrollResult.json();
          
          if (scrollData.success) {
            addActivityLog({
              activityType: "interaction",
              description: `Scrolled page ${direction}`,
              timestamp: new Date()
            });
            
            toast({
              title: "Scroll successful",
              description: `Scrolled ${direction}`,
            });
          } else {
            throw new Error(scrollData.error || "Scroll failed");
          }
          break;
          
        case 'help':
          addActivityLog({
            activityType: "info",
            description: "Showed help information",
            timestamp: new Date()
          });
          
          toast({
            title: "Help",
            description: "Check the Command Reference panel for available commands",
          });
          break;
          
        default:
          throw new Error(`Unknown command: ${action}. Type 'help' for available commands.`);
      }
      
      setStatus("idle");
    } catch (error: any) {
      setStatus("error");
      
      addActivityLog({
        activityType: "error",
        description: error.message,
        timestamp: new Date()
      });
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingState({
        isLoading: false,
        message: ""
      });
    }
  }, [currentUrl, onExtraction, toast]);

  // Helper function to add activity log
  const addActivityLog = useCallback((log: Omit<ActivityLogItem, 'id'>) => {
    setActivityLogs(prev => [
      { 
        id: Date.now().toString(),
        ...log 
      },
      ...prev
    ]);
  }, []);

  // Function to process extracted data
  const handleExtractedData = useCallback((data: any) => {
    onExtraction(data);
  }, [onExtraction]);

  return {
    status,
    currentUrl,
    activityLogs,
    executeCommand,
    loadingState,
    handleExtractedData
  };
}
