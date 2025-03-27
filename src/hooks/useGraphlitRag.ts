
import { useState, useCallback } from 'react';
import { safeMcpCall } from '@/lib/mcpUtils';

/**
 * Hook to interact with Graphlit RAG system through MCP server
 * Provides methods for retrieving context, storing conversations and tasks
 */
export function useGraphlitRag() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSources, setLastSources] = useState<any[]>([]);

  /**
   * Retrieve relevant sources based on a prompt
   * @param prompt User query or task description
   * @param options Additional options for retrieval
   */
  const retrieveContextForPrompt = useCallback(async (prompt: string, options = {}) => {
    setIsLoading(true);
    try {
      // Direct MCP call to Graphlit using safety utility
      const result = await safeMcpCall('graphlit-mcp-server', 'mcp0_retrieveSources', {
        prompt,
        ...options
      });

      if (result && result.sources) {
        setLastSources(result.sources);
        return result.sources;
      }
      return [];
    } catch (error) {
      console.error('Error retrieving RAG sources:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Store a conversation in the RAG system
   * @param title Conversation title
   * @param userMessage User's message
   * @param aiResponse AI's response
   */
  const storeConversationMessage = useCallback(async (title: string, userMessage: string, aiResponse: string) => {
    try {
      // Format conversation for storage
      const content = `# ${title}\n\n**User:** ${userMessage}\n\n**AI:** ${aiResponse}`;
      
      // Ingest directly using MCP with safety utility
      return await safeMcpCall('graphlit-mcp-server', 'mcp0_ingestText', {
        name: `PainterGrowth Coach: ${title || new Date().toLocaleString()}`,
        text: content,
        textType: "MARKDOWN"
      });
    } catch (error) {
      console.error('Error storing conversation in RAG:', error);
      return null;
    }
  }, []);

  /**
   * Store a task with AI analysis in RAG system
   * @param task Task object with title, description, and AI analysis
   */
  const storeCompassTask = useCallback(async (task: {
    title: string;
    description: string;
    aiAnalysis?: string;
    priority?: string;
    category?: string;
  }) => {
    try {
      // Format task for storage
      const content = `# Task: ${task.title}\n\n**Description:** ${task.description}\n\n${
        task.aiAnalysis ? `**AI Analysis:** ${task.aiAnalysis}\n\n` : ''
      }${task.priority ? `**Priority:** ${task.priority}\n\n` : ''}${
        task.category ? `**Category:** ${task.category}` : ''
      }`;
      
      return await safeMcpCall('graphlit-mcp-server', 'mcp0_ingestText', {
        name: `Strategic Compass: ${task.title}`,
        text: content,
        textType: "MARKDOWN"
      });
    } catch (error) {
      console.error('Error storing task in RAG:', error);
      return null;
    }
  }, []);

  /**
   * Store external knowledge in the RAG system
   * @param title Knowledge title
   * @param content Knowledge content
   */
  const storeKnowledge = useCallback(async (title: string, content: string) => {
    try {
      return await safeMcpCall('graphlit-mcp-server', 'mcp0_ingestText', {
        name: `Knowledge: ${title}`,
        text: content,
        textType: "MARKDOWN"
      });
    } catch (error) {
      console.error('Error storing knowledge in RAG:', error);
      return null;
    }
  }, []);

  /**
   * Ingest content from a URL
   * @param url URL to ingest
   */
  const ingestUrl = useCallback(async (url: string) => {
    try {
      return await safeMcpCall('graphlit-mcp-server', 'mcp0_ingestUrl', {
        url
      });
    } catch (error) {
      console.error('Error ingesting URL in RAG:', error);
      return null;
    }
  }, []);

  return {
    retrieveContextForPrompt,
    storeConversationMessage,
    storeCompassTask,
    storeKnowledge,
    ingestUrl,
    isLoading,
    lastSources
  };
}
