import axios from 'axios';
import { z } from 'zod';
import { storage } from './storage';

// Define types for DeepSeek API requests and responses
export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequestBody {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface DeepSeekResponseChoice {
  index: number;
  message: DeepSeekMessage;
  finish_reason: string;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: DeepSeekResponseChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEFAULT_MODEL = 'deepseek-chat';

// Service for interacting with DeepSeek AI API
export const aiService = {
  /**
   * Send a request to the DeepSeek AI API
   */
  async generateResponse(messages: DeepSeekMessage[], options: { temperature?: number; max_tokens?: number } = {}) {
    try {
      if (!DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API key is not configured');
      }

      const requestBody: DeepSeekRequestBody = {
        model: DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1000,
      };

      const response = await axios.post<DeepSeekResponse>(
        DEEPSEEK_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
        }
      );

      // Log the AI interaction without sensitive data
      await storage.logActivity({
        userId: 1, // Default user
        activityType: 'ai-interaction',
        description: 'Received response from DeepSeek AI',
        metadata: {
          tokenUsage: response.data.usage,
          model: response.data.model,
        },
      });

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error calling DeepSeek API:', error.message);
      
      // Log the error
      await storage.logActivity({
        userId: 1,
        activityType: 'error',
        description: 'Failed to get response from DeepSeek AI',
        metadata: { error: error.message },
      });
      
      throw new Error(`AI service error: ${error.message}`);
    }
  },

  /**
   * Analyze extracted web content
   */
  async analyzeContent(content: string, instructions: string) {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant that analyzes web content. Provide clear, concise analysis.'
      },
      {
        role: 'user',
        content: `${instructions}\n\nHere is the content to analyze:\n${content}`
      }
    ];
    
    return this.generateResponse(messages, { temperature: 0.5 });
  },

  /**
   * Generate suggestions for next actions based on current webpage
   */
  async suggestActions(pageContent: string, url: string) {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant that suggests web navigation actions. Provide 3-5 specific, actionable suggestions.'
      },
      {
        role: 'user',
        content: `I'm currently on this webpage: ${url}\n\nHere's the page content:\n${pageContent}\n\nSuggest some specific actions I could take next (e.g., elements to click, data to extract, specific navigation commands).`
      }
    ];
    
    return this.generateResponse(messages, { temperature: 0.7 });
  },

  /**
   * Generate a step-by-step plan to accomplish a task
   */
  async createTaskPlan(task: string) {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant that creates step-by-step plans for web automation tasks. Be specific with selectors and commands.'
      },
      {
        role: 'user',
        content: `I want to accomplish this task with the web automation agent: ${task}\n\nCreate a step-by-step plan using the available commands: navigate, click, type, extract, scroll.`
      }
    ];
    
    return this.generateResponse(messages, { temperature: 0.2 });
  }
};
