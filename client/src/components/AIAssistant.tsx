import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Brain, Lightbulb, AlignLeft } from "lucide-react";

interface AIAssistantProps {
  currentUrl: string;
  onSuggestedCommand?: (command: string) => void;
}

const AIAssistant = ({ currentUrl, onSuggestedCommand }: AIAssistantProps) => {
  const [activeTab, setActiveTab] = useState("analyze");
  const [content, setContent] = useState("");
  const [instructions, setInstructions] = useState("");
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!content || !instructions) {
      toast({
        title: "Missing Information",
        description: "Please provide both content and instructions",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/ai/analyze", {
        content,
        instructions
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.analysis);
        toast({
          title: "Analysis Complete",
          description: "Content has been analyzed by AI",
        });
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestActions = async () => {
    if (!currentUrl) {
      toast({
        title: "No Active Page",
        description: "Please navigate to a webpage first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // For now, we'll use a dummy page content
      // In a real implementation, we would need to extract the current page content
      const pageContent = "This is a dummy page content. In a real implementation, we would extract the actual page content.";
      
      const response = await apiRequest("POST", "/api/ai/suggest-actions", {
        url: currentUrl,
        pageContent
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.suggestions);
        toast({
          title: "Suggestions Ready",
          description: "AI has suggested actions for this page",
        });
      } else {
        throw new Error(data.error || "Failed to generate suggestions");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to suggest actions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!task) {
      toast({
        title: "Missing Task",
        description: "Please describe the task you want to accomplish",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/ai/create-plan", {
        task
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data.plan);
        toast({
          title: "Plan Created",
          description: "AI has created a step-by-step plan",
        });
      } else {
        throw new Error(data.error || "Failed to create plan");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const useCommand = (command: string) => {
    if (onSuggestedCommand) {
      onSuggestedCommand(command);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "analyze":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Content to Analyze</label>
              <Textarea 
                placeholder="Paste content you want to analyze"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instructions</label>
              <Input 
                placeholder="What would you like to know about this content?"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !content || !instructions}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Content
                </>
              )}
            </Button>
          </div>
        );
      case "suggest":
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-secondary/30">
              <p className="text-sm">Current URL: {currentUrl || "Not navigated yet"}</p>
            </div>
            <Button
              onClick={handleSuggestActions}
              disabled={loading || !currentUrl}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating suggestions...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Suggest Actions
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 italic">
              This will analyze the current page and suggest possible actions you can take.
            </p>
          </div>
        );
      case "plan":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Task Description</label>
              <Textarea 
                placeholder="Describe what you want to accomplish (e.g., 'Find the best-rated restaurants in New York')"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleCreatePlan}
              disabled={loading || !task}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating plan...
                </>
              ) : (
                <>
                  <AlignLeft className="mr-2 h-4 w-4" />
                  Create Task Plan
                </>
              )}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const parseCommandsFromResult = (text: string): string[] => {
    // Look for commands in the format of "navigate <url>", "click <selector>", etc.
    const commandRegex = /(navigate|click|type|extract|scroll)\s+([^\n]+)/g;
    const matches: RegExpExecArray[] = [];
    
    // Use a manual loop to collect all matches
    let match: RegExpExecArray | null;
    while ((match = commandRegex.exec(text)) !== null) {
      matches.push(match);
    }
    
    // Extract the full matched command from each result
    return matches.map(m => m[0]);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden ai-card">
      <div className="bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-white flex justify-between items-center rounded-t-md">
        <span className="font-medium flex items-center">
          <Brain className="mr-2 h-5 w-5" />
          <span className="text-lg">DeepSeek AI Assistant</span>
        </span>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="suggest">Suggest</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
        
        {result && (
          <div className="mt-4">
            <div className="p-4 rounded-md bg-secondary/20 whitespace-pre-wrap text-sm mt-2">
              {result}
            </div>
            
            {/* Extract and display any commands found in the result */}
            {parseCommandsFromResult(result).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Suggested Commands:</h4>
                <div className="space-y-2">
                  {parseCommandsFromResult(result).map((command, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                      <code className="text-xs">{command}</code>
                      <Button size="sm" variant="ghost" onClick={() => useCommand(command)}>
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIAssistant;