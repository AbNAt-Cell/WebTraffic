import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Repeat, Link, Globe, Play, Pause, RefreshCw } from "lucide-react";

interface VisitFormProps {
  currentUrl: string;
  onExecute?: (command: string) => void;
}

const VisitForm = ({ currentUrl, onExecute }: VisitFormProps) => {
  const { toast } = useToast();
  
  // Form state
  const [url, setUrl] = useState(currentUrl || "");
  const [visitType, setVisitType] = useState("single");
  const [frequency, setFrequency] = useState<number>(30); // minutes
  const [followLinks, setFollowLinks] = useState(false);
  const [depth, setDepth] = useState(2);
  const [maxVisits, setMaxVisits] = useState(100);
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visitCount, setVisitCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState("");
  
  // Progress simulation interval
  const [progressInterval, setProgressInterval] = useState<number | null>(null);

  const startExecution = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to visit.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExecuting(true);
    setProgress(0);
    setVisitCount(0);
    setCurrentStatus("Initializing...");
    
    try {
      if (visitType === "single") {
        // For single visits, we'll just use the navigate API
        if (onExecute) {
          onExecute(`navigate ${url}`);
        } else {
          await apiRequest("POST", "/api/navigate", { url });
        }
        
        // Simulate progress
        let currentProgress = 0;
        const interval = window.setInterval(() => {
          currentProgress += 5;
          if (currentProgress > 100) {
            clearInterval(interval);
            setProgress(100);
            setCurrentStatus("Visit complete!");
            setTimeout(() => setIsExecuting(false), 1000);
            return;
          }
          setProgress(currentProgress);
          
          if (currentProgress > 30 && currentProgress < 70) {
            setCurrentStatus("Analyzing page content...");
          } else if (currentProgress >= 70) {
            setCurrentStatus("Finishing up...");
          } else {
            setCurrentStatus("Loading page...");
          }
        }, 200);
        setProgressInterval(interval);
      } else {
        // For automated visits, create a schedule
        const response = await apiRequest("POST", "/api/schedules", {
          url,
          frequency: "custom", // Use custom frequency in minutes
          startAt: new Date(),
          maxVisits,
          followLinks,
          maxDepth: depth,
          active: true,
          description: `Auto-visit every ${frequency} minutes`
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Schedule Created",
            description: `Will visit ${url} every ${frequency} minutes.`
          });
          
          // Start the scheduler
          await apiRequest("POST", "/api/scheduler/control", { action: "start" });
          
          // Set up progress tracking
          let visitsMade = 0;
          let elapsed = 0;
          const minutesInMs = frequency * 60 * 1000;
          
          const interval = window.setInterval(() => {
            elapsed += 1000; // Add 1 second
            
            if (elapsed % (30 * 1000) === 0) { // Every 30 seconds
              // Simulate a visit happening based on frequency
              const shouldVisit = Math.random() < 0.5; // 50% chance of visit in demo
              
              if (shouldVisit && visitsMade < maxVisits) {
                visitsMade++;
                setVisitCount(visitsMade);
              }
            }
            
            // Calculate progress percentage
            const newProgress = Math.min(100, (visitsMade / maxVisits) * 100);
            setProgress(newProgress);
            
            // Calculate time remaining
            const timeRemainingMs = minutesInMs - (elapsed % minutesInMs);
            setTimeRemaining(Math.ceil(timeRemainingMs / 1000));
            
            if (visitsMade >= maxVisits) {
              clearInterval(interval);
              setCurrentStatus("All visits completed!");
              setTimeout(() => setIsExecuting(false), 1000);
            } else {
              const nextVisitSeconds = Math.ceil(timeRemainingMs / 1000);
              setCurrentStatus(
                `Made ${visitsMade} of ${maxVisits} visits. ` +
                `Next visit in ${Math.floor(nextVisitSeconds / 60)}m ${nextVisitSeconds % 60}s`
              );
            }
          }, 1000);
          
          setProgressInterval(interval);
        } else {
          throw new Error(data.error || "Failed to create schedule");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while visiting the URL.",
        variant: "destructive"
      });
      setIsExecuting(false);
    }
  };

  const stopExecution = async () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    
    setIsExecuting(false);
    setTimeRemaining(null);
    setCurrentStatus("Stopped");
    
    try {
      // Stop the scheduler if running automated visits
      if (visitType === "automated") {
        await apiRequest("POST", "/api/scheduler/control", { action: "stop" });
      }
      
      toast({
        title: "Execution Stopped",
        description: "All visits have been stopped."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to stop execution properly.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-md text-white py-4">
        <CardTitle className="flex items-center text-xl">
          <Globe className="mr-2 h-5 w-5" />
          Web Visit Executor
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL to Visit</Label>
          <div className="flex gap-2">
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
            {currentUrl && currentUrl !== url && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setUrl(currentUrl)}
                title="Use current URL"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <Tabs value={visitType} onValueChange={setVisitType} className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Single Visit
            </TabsTrigger>
            <TabsTrigger value="automated" className="flex items-center">
              <Repeat className="mr-2 h-4 w-4" />
              Automated Visits
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="pt-4 space-y-4">
            <div className="p-3 bg-blue-50 rounded-md dark:bg-slate-800 text-sm">
              Perform a single visit to the specified URL and analyze the page content.
            </div>
          </TabsContent>
          
          <TabsContent value="automated" className="pt-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Visit Frequency (minutes)</Label>
                <span className="text-sm font-medium">{frequency}</span>
              </div>
              <Slider
                min={1}
                max={120}
                step={1}
                value={[frequency]}
                onValueChange={(values) => setFrequency(values[0])}
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Visits</Label>
                  <span className="text-sm font-medium">{maxVisits}</span>
                </div>
                <Slider
                  min={10}
                  max={10000}
                  step={10}
                  value={[maxVisits]}
                  onValueChange={(values) => setMaxVisits(values[0])}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="followLinks"
                  checked={followLinks}
                  onCheckedChange={setFollowLinks}
                />
                <Label htmlFor="followLinks" className="flex items-center cursor-pointer">
                  <Link className="mr-2 h-4 w-4" />
                  Follow Links
                </Label>
              </div>
              
              {followLinks && (
                <div className="space-y-2 pl-8">
                  <div className="flex items-center justify-between">
                    <Label>Max Link Depth</Label>
                    <span className="text-sm font-medium">{depth}</span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[depth]}
                    onValueChange={(values) => setDepth(values[0])}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {isExecuting && (
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="p-3 bg-slate-50 rounded-md dark:bg-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="inline-block mr-1 h-3 w-3" />
                  Status:
                </span>
                <span className="text-sm font-medium">{currentStatus}</span>
              </div>
              
              {visitType === "automated" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    <Globe className="inline-block mr-1 h-3 w-3" />
                    Visits Made:
                  </span>
                  <span className="text-sm font-medium">{visitCount} of {maxVisits}</span>
                </div>
              )}
              
              {timeRemaining !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="inline-block mr-1 h-3 w-3" />
                    Next Visit In:
                  </span>
                  <span className="text-sm font-medium">
                    {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-4 bg-slate-50 dark:bg-slate-900 rounded-b-md">
        {!isExecuting ? (
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={startExecution}
          >
            <Play className="mr-2 h-4 w-4" />
            {visitType === "single" ? "Visit Now" : "Start Auto-Visits"}
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="w-full"
            onClick={stopExecution}
          >
            <Pause className="mr-2 h-4 w-4" />
            Stop Execution
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default VisitForm;