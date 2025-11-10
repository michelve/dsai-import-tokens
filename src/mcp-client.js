// WebSocket client for MCP communication
// Handles bidirectional communication with MCP server

let mcpSocket = null;
let mcpChannel = null;
let mcpConnected = false;
let mcpPort = 3055; // Default MCP WebSocket port

// Initialize MCP settings
async function initializeMCPSettings() {
  const enabled = await figma.clientStorage.getAsync('mcpEnabled');
  const port = await figma.clientStorage.getAsync('mcpPort');
  const channel = await figma.clientStorage.getAsync('mcpChannel');
  
  mcpPort = port || 3055;
  mcpChannel = channel || '';
  
  return { enabled: enabled || false, port: mcpPort, channel: mcpChannel };
}

// Connect to MCP WebSocket server
function connectToMCP(port, channel) {
  return new Promise((resolve, reject) => {
    if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) {
      mcpSocket.close();
    }
    
    try {
      const url = `ws://localhost:${port}`;
      mcpSocket = new WebSocket(url);
      mcpPort = port;
      mcpChannel = channel;
      
      mcpSocket.onopen = () => {
        console.log('MCP WebSocket connected');
        
        // Join channel
        const joinMessage = {
          id: generateId(),
          type: 'join',
          channel: channel
        };
        
        mcpSocket.send(JSON.stringify(joinMessage));
        mcpConnected = true;
        
        figma.clientStorage.setAsync('mcpEnabled', true);
        figma.clientStorage.setAsync('mcpPort', port);
        figma.clientStorage.setAsync('mcpChannel', channel);
        
        resolve({ success: true, port, channel });
      };
      
      mcpSocket.onerror = (error) => {
        console.error('MCP WebSocket error:', error);
        mcpConnected = false;
        reject({ success: false, message: 'Failed to connect to MCP server' });
      };
      
      mcpSocket.onclose = () => {
        console.log('MCP WebSocket disconnected');
        mcpConnected = false;
        mcpSocket = null;
      };
      
      mcpSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMCPCommand(message);
        } catch (error) {
          console.error('Error parsing MCP message:', error);
        }
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      reject({ success: false, message: error.message });
    }
  });
}

// Disconnect from MCP server
export function disconnectFromMCP() {
  if (mcpSocket) {
    mcpSocket.close();
    mcpSocket = null;
    mcpConnected = false;
    mcpChannel = null;
  }
  
  figma.clientStorage.setAsync('mcpEnabled', false);
  
  return { success: true };
}

// Get MCP connection status
export function getMCPStatus() {
  return {
    connected: mcpConnected,
    port: mcpPort,
    channel: mcpChannel
  };
}

// Handle incoming MCP commands
async function handleMCPCommand(message) {
  if (message.type !== 'message') return;
  
  const { id, message: commandData } = message;
  const { command, params } = commandData || {};
  
  try {
    let result;
    
    switch (command) {
      case 'get_collections':
        result = await getCollections();
        break;
        
      case 'get_collection':
        result = await getCollection(params.collectionName);
        break;
        
      case 'export_theme':
        result = await exportTheme(params.format);
        break;
        
      case 'get_variable':
        result = await getVariable(params.variableName, params.collectionName);
        break;
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
    
    // Send response back
    sendMCPResponse(id, result);
    
  } catch (error) {
    console.error('MCP command error:', error);
    sendMCPError(id, error.message);
  }
}

// Send response to MCP server
function sendMCPResponse(id, result) {
  if (!mcpSocket || !mcpConnected) return;
  
  const response = {
    id,
    type: 'response',
    channel: mcpChannel,
    result
  };
  
  mcpSocket.send(JSON.stringify(response));
}

// Send error to MCP server
function sendMCPError(id, errorMessage) {
  if (!mcpSocket || !mcpConnected) return;
  
  const error = {
    id,
    type: 'error',
    channel: mcpChannel,
    error: errorMessage
  };
  
  mcpSocket.send(JSON.stringify(error));
}

// Generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Command implementations

async function getCollections() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  return collections.map(collection => {
    const modes = collection.modes.map(mode => ({
      id: mode.modeId,
      name: mode.name
    }));
    
    return {
      id: collection.id,
      name: collection.name,
      modes,
      variableCount: collection.variableIds.length
    };
  });
}

async function getCollection(collectionName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find(c => c.name === collectionName);
  
  if (!collection) {
    throw new Error(`Collection not found: ${collectionName}`);
  }
  
  const variables = [];
  for (const varId of collection.variableIds) {
    const variable = await figma.variables.getVariableByIdAsync(varId);
    if (variable) {
      const varData = {
        id: variable.id,
        name: variable.name,
        resolvedType: variable.resolvedType,
        values: {}
      };
      
      // Get values for each mode
      for (const mode of collection.modes) {
        const value = variable.valuesByMode[mode.modeId];
        varData.values[mode.name] = await resolveValue(value, variable.resolvedType);
      }
      
      variables.push(varData);
    }
  }
  
  return {
    id: collection.id,
    name: collection.name,
    modes: collection.modes.map(m => ({ id: m.modeId, name: m.name })),
    variables
  };
}

async function exportTheme(format = 'json') {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const theme = {};
  
  for (const collection of collections) {
    const collectionData = await getCollection(collection.name);
    theme[collection.name] = collectionData;
  }
  
  if (format === 'json') {
    return theme;
  }
  
  // TODO: Add CSS/SCSS formatting
  return theme;
}

async function getVariable(variableName, collectionName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Filter by collection if specified
  const searchCollections = collectionName
    ? collections.filter(c => c.name === collectionName)
    : collections;
  
  for (const collection of searchCollections) {
    for (const varId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(varId);
      if (variable && variable.name === variableName) {
        const varData = {
          id: variable.id,
          name: variable.name,
          collection: collection.name,
          resolvedType: variable.resolvedType,
          values: {}
        };
        
        for (const mode of collection.modes) {
          const value = variable.valuesByMode[mode.modeId];
          varData.values[mode.name] = await resolveValue(value, variable.resolvedType);
        }
        
        return varData;
      }
    }
  }
  
  throw new Error(`Variable not found: ${variableName}`);
}

// Helper to resolve variable values
async function resolveValue(value, type) {
  if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const aliasVar = await figma.variables.getVariableByIdAsync(value.id);
    if (aliasVar) {
      return { alias: aliasVar.name };
    }
  }
  
  if (type === 'COLOR' && typeof value === 'object') {
    return {
      r: Math.round(value.r * 255),
      g: Math.round(value.g * 255),
      b: Math.round(value.b * 255),
      a: value.a || 1
    };
  }
  
  return value;
}

// Auto-connect on plugin load
initializeMCPSettings().then(settings => {
  if (settings.enabled && settings.channel) {
    connectToMCP(settings.port, settings.channel).catch(err => {
      console.log('MCP auto-connect failed:', err);
    });
  }
});
