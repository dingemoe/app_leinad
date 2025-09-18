// classes/channel.js
import { El, div, span, input, button, ul, li, p, h3 } from "./html.js";

export class Channel extends El {
  constructor(channelId, options = {}) {
    super("div");
    
    this.channelId = channelId;
    this.options = {
      maxMessages: 100,
      autoScroll: true,
      showUserList: true,
      showTimestamps: true,
      allowEmoji: true,
      wsUrl: null,
      httpEndpoint: null,
      ...options
    };
    
    this.messages = [];
    this.users = new Map(); // userId -> { name, status, lastSeen }
    this.agents = new Map(); // agentId -> { name, type, status }
    this.ws = null;
    this.messageContainer = null;
    this.inputField = null;
    
    this.className("channel-container flex flex-col h-full bg-white dark:bg-gray-900");
    this._ready = this._init();
  }

  async _init() {
    this._buildUI();
    this._setupConnections();
    return this;
  }

  _buildUI() {
    const header = div()
      .className("channel-header p-4 border-b border-gray-200 dark:border-gray-700")
      .set([
        div().className("flex justify-between items-center").set([
          h3().className("text-lg font-semibold text-gray-900 dark:text-white")
            .text(`#${this.channelId}`),
          div().className("flex items-center space-x-2").set([
            span().className("online-indicator w-2 h-2 bg-green-500 rounded-full"),
            span().className("text-sm text-gray-500").text("Online: 0")
          ])
        ])
      ]);

    this.messageContainer = div()
      .className("messages-container flex-1 overflow-y-auto p-4 space-y-3")
      .attr("id", `messages-${this.channelId}`)
      .listen((event) => {
        if (event.type === 'mutation' && this.options.autoScroll) {
          this._scrollToBottom();
        }
      });

    const inputContainer = div()
      .className("input-container p-4 border-t border-gray-200 dark:border-gray-700")
      .set([
        div().className("flex space-x-2").set([
          this.inputField = input()
            .className("flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white")
            .attr("placeholder", "Skriv en melding...")
            .attr("maxlength", "500"),
          button()
            .className("px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500")
            .text("Send")
            .attr("type", "button")
        ])
      ]);

    // Setup input handlers
    this._setupInputHandlers();

    this.set([header, this.messageContainer, inputContainer]);
  }

  _setupInputHandlers() {
    // Handle Enter key
    this.inputField.props.onKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    };

    // Handle button click
    this.inputField.props.onKeyUp = (e) => {
      if (e.target.value.trim()) {
        this._sendTypingIndicator();
      }
    };
  }

  _setupConnections() {
    // WebSocket connection
    if (this.options.wsUrl) {
      this._connectWebSocket();
    }

    // HTTP polling fallback
    if (this.options.httpEndpoint && !this.options.wsUrl) {
      this._startHttpPolling();
    }
  }

  _connectWebSocket() {
    try {
      this.ws = new WebSocket(this.options.wsUrl);
      
      this.ws.onopen = () => {
        console.log(`Channel ${this.channelId} connected via WebSocket`);
        this._sendJoinMessage();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this._handleIncomingMessage(data);
      };

      this.ws.onclose = () => {
        console.log(`Channel ${this.channelId} WebSocket closed`);
        // Auto-reconnect after 3 seconds
        setTimeout(() => this._connectWebSocket(), 3000);
      };

      this.ws.onerror = (error) => {
        console.error(`Channel ${this.channelId} WebSocket error:`, error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  _startHttpPolling() {
    setInterval(async () => {
      try {
        const response = await fetch(`${this.options.httpEndpoint}/messages?channel=${this.channelId}&since=${this._getLastMessageTime()}`);
        const data = await response.json();
        
        if (data.messages) {
          data.messages.forEach(msg => this._handleIncomingMessage(msg));
        }
      } catch (error) {
        console.error('HTTP polling error:', error);
      }
    }, 2000);
  }

  _sendMessage() {
    const messageText = this.inputField.props.value?.trim();
    if (!messageText) return;

    const message = {
      id: this._generateId(),
      type: 'message',
      channel: this.channelId,
      text: messageText,
      timestamp: Date.now(),
      sender: {
        id: 'current-user', // Should be set from outside
        name: 'You',
        type: 'user'
      }
    };

    // Send via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
    
    // Send via HTTP
    if (this.options.httpEndpoint) {
      fetch(`${this.options.httpEndpoint}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      }).catch(console.error);
    }

    // Add to local messages immediately for instant feedback
    this._addMessage(message);
    
    // Clear input
    this.inputField.props.value = '';
    if (this.inputField.props.ref) {
      const element = this.inputField.props.ref;
      if (element) element.value = '';
    }
  }

  _handleIncomingMessage(data) {
    switch (data.type) {
      case 'message':
        this._addMessage(data);
        break;
      case 'user_joined':
        this._handleUserJoined(data);
        break;
      case 'user_left':
        this._handleUserLeft(data);
        break;
      case 'typing':
        this._handleTyping(data);
        break;
      case 'agent_update':
        this._handleAgentUpdate(data);
        break;
    }
  }

  _addMessage(message) {
    // Prevent duplicate messages
    if (this.messages.find(m => m.id === message.id)) return;

    this.messages.push(message);
    
    // Limit message history
    if (this.messages.length > this.options.maxMessages) {
      this.messages = this.messages.slice(-this.options.maxMessages);
    }

    const messageEl = this._createMessageElement(message);
    this.messageContainer.children.push(messageEl);
    
    // Trigger re-render if needed
    this._updateMessageContainer();
  }

  _createMessageElement(message) {
    const isOwn = message.sender.id === 'current-user';
    const isAgent = message.sender.type === 'agent';
    
    const timestamp = this.options.showTimestamps 
      ? span().className("text-xs text-gray-500 ml-2")
          .text(new Date(message.timestamp).toLocaleTimeString())
      : null;

    const senderName = span()
      .className(`font-medium ${isAgent ? 'text-purple-600' : isOwn ? 'text-blue-600' : 'text-gray-800'} dark:text-white`)
      .text(message.sender.name + (isAgent ? ' 🤖' : ''));

    const messageText = span()
      .className("text-gray-900 dark:text-gray-100")
      .text(message.text);

    return div()
      .className(`message flex ${isOwn ? 'justify-end' : 'justify-start'}`)
      .set([
        div()
          .className(`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwn 
              ? 'bg-blue-500 text-white' 
              : isAgent 
                ? 'bg-purple-100 dark:bg-purple-900' 
                : 'bg-gray-100 dark:bg-gray-800'
          }`)
          .set([
            div().className("flex items-baseline space-x-1").set([
              senderName,
              timestamp
            ].filter(Boolean)),
            messageText
          ])
      ]);
  }

  _updateMessageContainer() {
    // Force DOM update - this would need to be handled by the rendering system
    if (this.options.autoScroll) {
      setTimeout(() => this._scrollToBottom(), 100);
    }
  }

  _scrollToBottom() {
    // This would need to be implemented in the actual DOM
    const container = document.getElementById(`messages-${this.channelId}`);
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  _sendTypingIndicator() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        channel: this.channelId,
        sender: { id: 'current-user', name: 'You' }
      }));
    }
  }

  _sendJoinMessage() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join',
        channel: this.channelId,
        sender: { id: 'current-user', name: 'You', type: 'user' }
      }));
    }
  }

  _handleUserJoined(data) {
    this.users.set(data.sender.id, {
      name: data.sender.name,
      status: 'online',
      lastSeen: Date.now()
    });
    this._updateOnlineCount();
  }

  _handleUserLeft(data) {
    this.users.delete(data.sender.id);
    this._updateOnlineCount();
  }

  _handleAgentUpdate(data) {
    this.agents.set(data.agent.id, {
      name: data.agent.name,
      type: data.agent.type,
      status: data.agent.status
    });
  }

  _handleTyping(data) {
    // Show typing indicator
    console.log(`${data.sender.name} is typing...`);
  }

  _updateOnlineCount() {
    const count = this.users.size + this.agents.size;
    // Update online indicator - would need DOM manipulation
  }

  _generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _getLastMessageTime() {
    return this.messages.length > 0 
      ? Math.max(...this.messages.map(m => m.timestamp))
      : 0;
  }

  // Public API methods
  addUser(userId, userData) {
    this.users.set(userId, userData);
    this._updateOnlineCount();
  }

  addAgent(agentId, agentData) {
    this.agents.set(agentId, agentData);
    this._updateOnlineCount();
  }

  sendSystemMessage(text) {
    this._addMessage({
      id: this._generateId(),
      type: 'system',
      text,
      timestamp: Date.now(),
      sender: { id: 'system', name: 'System', type: 'system' }
    });
  }

  clear() {
    this.messages = [];
    this.messageContainer.children = [];
    this._updateMessageContainer();
  }

  setCurrentUser(userId, userName) {
    // Update current user info
    this.currentUser = { id: userId, name: userName };
  }
}

// Factory function
export const channel = (channelId, options = {}) => new Channel(channelId, options);