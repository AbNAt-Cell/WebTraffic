// Activity log type
export interface ActivityLogItem {
  id: string;
  activityType: string; // navigation, interaction, extraction, error, info
  description: string;
  timestamp: string | Date;
  metadata?: Record<string, any>;
}

// Extracted data item
export interface ExtractedDataItem {
  [key: string]: any;
}

// Agent settings type
export interface AgentSettings {
  behavior: string;
  navigationTimeout: number;
  userAgent: string;
  enableJavascript: boolean;
  acceptCookies: boolean;
  disableImages: boolean;
}

// Loading state type
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}
