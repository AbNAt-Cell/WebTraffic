import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExtractedDataItem } from "@/types";
import { useState } from "react";

interface ExtractedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExtractedDataItem[];
}

const ExtractedDataModal = ({ isOpen, onClose, data }: ExtractedDataModalProps) => {
  const [view, setView] = useState<'table' | 'json'>('table');
  
  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `web-agent-extraction-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-lg font-medium">Extracted Data</DialogTitle>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportData}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Extraction Results</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {data.length} {data.length === 1 ? 'item' : 'items'} found
                </span>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button 
                    className={`px-3 py-1 text-sm ${view === 'table' ? 'bg-primary text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setView('table')}
                  >
                    Table
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm ${view === 'json' ? 'bg-primary text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setView('json')}
                  >
                    JSON
                  </button>
                </div>
              </div>
            </div>
            
            {view === 'table' ? (
              <div className="border rounded-lg overflow-hidden">
                {data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(data[0]).map((key) => (
                            <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.map((item, index) => (
                          <tr key={index}>
                            {Object.entries(item).map(([key, value]) => (
                              <td key={key} className="px-4 py-3 truncate max-w-xs">
                                {typeof value === 'string' 
                                  ? (key === 'href' || key === 'src' 
                                      ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{value}</a> 
                                      : value.slice(0, 100) + (value.length > 100 ? '...' : ''))
                                  : JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No data extracted
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="font-mono text-xs overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtractedDataModal;
