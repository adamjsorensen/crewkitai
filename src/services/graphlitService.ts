
/**
 * Graphlit RAG Service for CrewKitAI
 * Handles collection management and initialization
 */
import { safeMcpCall, isMcpServerAvailable } from '@/lib/mcpUtils';

/**
 * Setup Graphlit collections for different content types
 * Creates collections for AI Coach conversations, Compass tasks, and knowledge base if they don't exist
 */
export async function setupGraphlitCollections() {
  try {
    // Query existing collections first to avoid duplicates
    const existingCollections = await safeMcpCall<any[]>('graphlit-mcp-server', 'mcp0_queryCollections', {
      limit: 100
    });
    
    const collectionNames = new Set(existingCollections?.map(c => c.name) || []);
    const collectionsToCreate = [
      'PainterGrowth Coach Conversations',
      'Strategic Compass Tasks',
      'Painting Knowledge Base'
    ].filter(name => !collectionNames.has(name));
    
    // Create missing collections
    const results = {};
    
    for (const name of collectionsToCreate) {
      try {
        const result = await safeMcpCall('graphlit-mcp-server', 'mcp0_createCollection', {
          name
        });
        results[name] = result;
        console.log(`Created collection: ${name}`);
      } catch (error) {
        console.error(`Error creating collection ${name}:`, error);
      }
    }
    
    return {
      success: true,
      created: results,
      existing: existingCollections
    };
  } catch (error) {
    console.error('Error setting up Graphlit collections:', error);
    return {
      success: false,
      error
    };
  }
}

/**
 * Add content to the appropriate collection based on content type
 * @param contentId ID of the content to add
 * @param contentType Type of content ('coach', 'compass', or 'knowledge')
 */
export async function addContentToCollection(contentId: string, contentType: 'coach' | 'compass' | 'knowledge') {
  try {
    // Map content type to collection name
    const collectionNameMap = {
      coach: 'PainterGrowth Coach Conversations',
      compass: 'Strategic Compass Tasks',
      knowledge: 'Painting Knowledge Base'
    };
    
    const collectionName = collectionNameMap[contentType];
    
    // Find collection by name
    const collections = await safeMcpCall<any[]>('graphlit-mcp-server', 'mcp0_queryCollections', {
      name: collectionName
    });
    
    if (!collections || collections.length === 0) {
      console.error(`Collection not found: ${collectionName}`);
      return null;
    }
    
    // Add content to collection
    return await safeMcpCall('graphlit-mcp-server', 'mcp0_addContentsToCollection', {
      id: collections[0].id,
      contents: [contentId]
    });
  } catch (error) {
    console.error('Error adding content to collection:', error);
    return null;
  }
}

/**
 * Check if Graphlit RAG system is available through MCP
 * @returns boolean indicating if Graphlit MCP is available
 */
export async function isGraphlitAvailable() {
  return await isMcpServerAvailable('graphlit-mcp-server');
}
