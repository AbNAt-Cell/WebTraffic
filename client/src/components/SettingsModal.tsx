import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    behavior: "standard",
    navigationTimeout: 30,
    userAgent: "Chrome (Windows)",
    enableJavascript: true,
    acceptCookies: true,
    disableImages: false
  });
  
  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings saved",
      description: "Your agent settings have been updated successfully.",
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Agent Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="behavior">Agent Behavior</Label>
            <Select
              value={settings.behavior}
              onValueChange={(value) => handleChange("behavior", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select behavior" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (Default)</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="navigationTimeout">Navigation Timeout (seconds)</Label>
            <Input
              id="navigationTimeout"
              type="number"
              value={settings.navigationTimeout}
              onChange={(e) => handleChange("navigationTimeout", parseInt(e.target.value))}
              min={5}
              max={120}
            />
          </div>
          
          <div>
            <Label htmlFor="userAgent">User Agent</Label>
            <Select
              value={settings.userAgent}
              onValueChange={(value) => handleChange("userAgent", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chrome (Windows)">Chrome (Windows)</SelectItem>
                <SelectItem value="Chrome (Mac)">Chrome (Mac)</SelectItem>
                <SelectItem value="Firefox (Windows)">Firefox (Windows)</SelectItem>
                <SelectItem value="Firefox (Mac)">Firefox (Mac)</SelectItem>
                <SelectItem value="Safari (Mac)">Safari (Mac)</SelectItem>
                <SelectItem value="Mobile - iPhone">Mobile - iPhone</SelectItem>
                <SelectItem value="Mobile - Android">Mobile - Android</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableJavascript"
              checked={settings.enableJavascript}
              onCheckedChange={(checked) => 
                handleChange("enableJavascript", checked === true)
              }
            />
            <Label htmlFor="enableJavascript">Enable JavaScript</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptCookies"
              checked={settings.acceptCookies}
              onCheckedChange={(checked) => 
                handleChange("acceptCookies", checked === true)
              }
            />
            <Label htmlFor="acceptCookies">Accept cookies</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="disableImages"
              checked={settings.disableImages}
              onCheckedChange={(checked) => 
                handleChange("disableImages", checked === true)
              }
            />
            <Label htmlFor="disableImages">Disable image loading</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
