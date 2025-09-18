// websocket_server.js - Enkel WebSocket server for chat testing

const channels = new Map(); // channelId -> Set of connections
const users = new Map();    // connectionId -> userInfo

Deno.serve({ port: 8080 }, (req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("WebSocket endpoint", { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const connectionId = crypto.randomUUID();
  
  socket.onopen = () => {
    console.log(`New WebSocket connection: ${connectionId}`);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleMessage(socket, connectionId, data);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket closed: ${connectionId}`);
    cleanup(connectionId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error ${connectionId}:`, error);
  };

  return response;
});

function handleMessage(socket, connectionId, data) {
  const { type, channel } = data;

  switch (type) {
    case 'join':
      joinChannel(socket, connectionId, channel, data.sender);
      break;
      
    case 'message':
      broadcastMessage(connectionId, data);
      break;
      
    case 'typing':
      broadcastTyping(connectionId, data);
      break;
      
    default:
      console.log(`Unknown message type: ${type}`);
  }
}

function joinChannel(socket, connectionId, channelId, userInfo) {
  // Leave previous channel
  cleanup(connectionId);
  
  // Join new channel
  if (!channels.has(channelId)) {
    channels.set(channelId, new Set());
  }
  
  channels.get(channelId).add(connectionId);
  users.set(connectionId, { socket, channel: channelId, ...userInfo });
  
  // Notify others about new user
  broadcast(channelId, {
    type: 'user_joined',
    channel: channelId,
    sender: userInfo,
    timestamp: Date.now()
  }, connectionId);
  
  // Send current users to new user
  const channelUsers = Array.from(channels.get(channelId))
    .filter(id => id !== connectionId)
    .map(id => users.get(id))
    .filter(Boolean);
    
  socket.send(JSON.stringify({
    type: 'channel_users',
    channel: channelId,
    users: channelUsers,
    timestamp: Date.now()
  }));

  console.log(`User ${userInfo.name} joined channel ${channelId}`);
}

function broadcastMessage(senderId, messageData) {
  const user = users.get(senderId);
  if (!user) return;

  // Add server timestamp
  messageData.timestamp = Date.now();
  messageData.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  broadcast(user.channel, messageData);
  console.log(`Message in ${user.channel}: ${messageData.text}`);
}

function broadcastTyping(senderId, typingData) {
  const user = users.get(senderId);
  if (!user) return;

  // Only broadcast to others, not sender
  broadcast(user.channel, {
    ...typingData,
    timestamp: Date.now()
  }, senderId);
}

function broadcast(channelId, data, excludeId = null) {
  const channelConnections = channels.get(channelId);
  if (!channelConnections) return;

  const message = JSON.stringify(data);
  
  for (const connectionId of channelConnections) {
    if (connectionId === excludeId) continue;
    
    const user = users.get(connectionId);
    if (user && user.socket.readyState === WebSocket.OPEN) {
      try {
        user.socket.send(message);
      } catch (error) {
        console.error(`Failed to send to ${connectionId}:`, error);
        // Remove failed connection
        channelConnections.delete(connectionId);
        users.delete(connectionId);
      }
    }
  }
}

function cleanup(connectionId) {
  const user = users.get(connectionId);
  if (user) {
    const channelConnections = channels.get(user.channel);
    if (channelConnections) {
      channelConnections.delete(connectionId);
      
      // Notify others about user leaving
      broadcast(user.channel, {
        type: 'user_left',
        channel: user.channel,
        sender: { id: user.id, name: user.name },
        timestamp: Date.now()
      });
      
      // Clean up empty channels
      if (channelConnections.size === 0) {
        channels.delete(user.channel);
      }
    }
    
    users.delete(connectionId);
    console.log(`User ${user.name} left channel ${user.channel}`);
  }
}

console.log("🚀 WebSocket chat server running on ws://localhost:8080/");
console.log("   Supports channels: general, support, ai-assistant, etc.");
console.log("   Message types: join, message, typing");