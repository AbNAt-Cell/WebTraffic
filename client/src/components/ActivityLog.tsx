import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ActivityLogItem } from "@/types";

interface ActivityLogProps {
  logs: ActivityLogItem[];
}

const ActivityLog = ({ logs }: ActivityLogProps) => {
  const [isLogExpanded, setIsLogExpanded] = useState(true);
  
  const getBorderColorClass = (type: string) => {
    switch (type) {
      case 'navigation':
        return 'activity-item-navigation';
      case 'interaction':
        return 'activity-item-interaction';
      case 'extraction':
        return 'activity-item-extraction';
      case 'error':
        return 'activity-item-error';
      default:
        return 'border-l-4 border-gray-400';
    }
  };
  
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="mt-4 h-64 overflow-hidden activity-log shadow-md">
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-white font-medium flex justify-between items-center rounded-t-md">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M2 12h2" />
            <path d="M6 12h2" />
            <path d="M10 12h2" />
            <path d="M18 12h4" />
            <path d="M14.5 9.5 16 12l-1.5 2.5" />
            <path d="M4 6V4h16v2" />
            <path d="M4 20v-2h16v2" />
          </svg>
          <span className="text-lg">Activity Log</span>
        </span>
        <div className="flex space-x-2">
          <button className="text-white opacity-70 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
          <button 
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => setIsLogExpanded(!isLogExpanded)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transform transition-transform ${isLogExpanded ? '' : 'rotate-180'}`}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>
      
      {isLogExpanded && (
        <div className="p-4 overflow-y-auto h-full">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No activity recorded yet
              </div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`activity-item ${getBorderColorClass(log.activityType)}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium capitalize">{log.activityType}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <p className="text-gray-600">{log.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ActivityLog;
