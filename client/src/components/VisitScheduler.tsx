import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, RefreshCw, Power, PowerOff, Trash2, Play, PauseCircle, Calendar, Clock } from "lucide-react";

interface VisitSchedulerProps {
  currentUrl: string;
}

interface ScheduleItem {
  id: string;
  url: string;
  frequency: string;
  startAt: Date;
  endAt?: Date;
  maxVisits: number;
  followLinks: boolean;
  maxDepth: number;
  description: string;
  active: boolean;
  progress?: number; // Calculated progress percentage
  visitCount?: number; // Current visit count
}

const VisitScheduler = ({ currentUrl }: VisitSchedulerProps) => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [visitsRemaining, setVisitsRemaining] = useState(200000);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to get human-readable frequency
  const getFrequencyDisplay = (schedule: ScheduleItem) => {
    // For "custom" frequency (which is in minutes)
    if (schedule.frequency === "custom") {
      // Extract minutes from description
      const minutesMatch = schedule.description.match(/every (\d+) minutes/);
      if (minutesMatch && minutesMatch[1]) {
        const minutes = parseInt(minutesMatch[1]);
        return `${minutes} minutes`;
      }
      return "Custom";
    }
    
    // For standard frequencies
    switch (schedule.frequency) {
      case "once":
        return "Once";
      case "hourly":
        return "Hourly";
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      default:
        return schedule.frequency;
    }
  };

  // Fetch schedules and visit stats
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get schedules
      const schedulesRes = await apiRequest("GET", "/api/schedules");
      const schedulesData = await schedulesRes.json();
      
      if (schedulesData.success) {
        // Transform dates from strings to Date objects
        const schedulesWithDates = schedulesData.schedules.map((s: any) => ({
          ...s,
          startAt: new Date(s.startAt),
          endAt: s.endAt ? new Date(s.endAt) : undefined,
          // Calculate progress (random for demo)
          progress: Math.floor(Math.random() * 100),
          visitCount: Math.floor(Math.random() * s.maxVisits)
        }));
        
        setSchedules(schedulesWithDates);
      }
      
      // Get visit stats
      const statsRes = await apiRequest("GET", "/api/visit-stats");
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setVisitsRemaining(statsData.stats.remainingVisits);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load schedules and visit stats.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toggle scheduler state
  const toggleScheduler = async () => {
    try {
      const action = isSchedulerRunning ? "stop" : "start";
      const res = await apiRequest("POST", "/api/scheduler/control", { action });
      const data = await res.json();
      
      if (data.success) {
        setIsSchedulerRunning(!isSchedulerRunning);
        toast({
          title: isSchedulerRunning ? "Scheduler Stopped" : "Scheduler Started",
          description: data.message
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to control scheduler",
        variant: "destructive"
      });
    }
  };

  // Handle schedule deletion
  const confirmDelete = (id: string) => {
    setScheduleToDelete(id);
    setIsAlertOpen(true);
  };

  const deleteSchedule = async () => {
    if (!scheduleToDelete) return;
    
    try {
      const res = await apiRequest("DELETE", `/api/schedules/${scheduleToDelete}`);
      const data = await res.json();
      
      if (data.success) {
        setSchedules(schedules.filter(s => s.id !== scheduleToDelete));
        toast({
          title: "Schedule Deleted",
          description: "The schedule has been successfully deleted."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive"
      });
    } finally {
      setScheduleToDelete(null);
      setIsAlertOpen(false);
    }
  };

  // Toggle a schedule's active state
  const toggleScheduleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await apiRequest("PATCH", `/api/schedules/${id}`, {
        active: !currentActive
      });
      const data = await res.json();
      
      if (data.success) {
        setSchedules(schedules.map(s => 
          s.id === id ? { ...s, active: !s.active } : s
        ));
        toast({
          title: "Schedule Updated",
          description: `Schedule ${currentActive ? "paused" : "activated"}.`
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-md text-white py-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center">
            <CalendarClock className="mr-2 h-5 w-5" />
            Visit Scheduler
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant={isSchedulerRunning ? "destructive" : "default"}
              className={isSchedulerRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
              onClick={toggleScheduler}
            >
              {isSchedulerRunning ? 
                <><PowerOff className="mr-1 h-4 w-4" /> Stop</> : 
                <><Power className="mr-1 h-4 w-4" /> Start</>
              }
            </Button>
            <Button size="sm" variant="secondary" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="p-4 bg-blue-50 dark:bg-slate-800 flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium">Visits Remaining:</span> {visitsRemaining.toLocaleString()}
          </div>
          <Badge variant="outline" className="bg-white dark:bg-slate-900">
            {isSchedulerRunning ? 
              <span className="flex items-center text-green-500"><Play className="mr-1 h-3 w-3" /> Running</span> : 
              <span className="flex items-center text-amber-500"><PauseCircle className="mr-1 h-3 w-3" /> Paused</span>
            }
          </Badge>
        </div>
        
        <ScrollArea className="h-[calc(100%-48px)]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
              <p>Loading schedules...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">No Schedules Yet</p>
              <p className="text-sm">Create schedules to automatically visit websites on a regular basis.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                <TableRow>
                  <TableHead className="w-[30%]">URL</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium truncate max-w-[150px]" title={schedule.url}>
                      {schedule.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3 text-gray-500" />
                        {getFrequencyDisplay(schedule)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={schedule.progress} className="h-2" />
                        <div className="text-xs text-gray-500">
                          {schedule.visitCount} of {schedule.maxVisits} visits
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => toggleScheduleActive(schedule.id, schedule.active)}
                          className={schedule.active ? "text-amber-500 hover:text-amber-600" : "text-green-500 hover:text-green-600"}
                        >
                          {schedule.active ? 
                            <PauseCircle className="h-4 w-4" /> : 
                            <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => confirmDelete(schedule.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSchedule} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default VisitScheduler;