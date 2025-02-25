// Import Tailwind styles
import styles from './styles.css?inline'

// Self-initializing chat widget
(function() {
  class ChatBox extends HTMLElement {
    constructor() {
      super();
      this.messages = [];
      this.attachShadow({ mode: 'open' });
      this.defaultWSUrl = window.CHAT_WS_URL || 'wss://echo.websocket.org';
      this.isOpen = false;

      // Add styles to shadow DOM
      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(styles);
      this.shadowRoot.adoptedStyleSheets = [styleSheet];
    }

    connectedCallback() {
      this.wsUrl = this.getAttribute('ws-url') || this.defaultWSUrl;
      this.initWebSocket();
      this.render();
      
      // Position the element in the bottom-right corner
      this.style.position = 'fixed';
      this.style.bottom = '20px';
      this.style.right = '20px';
      this.style.zIndex = '9999';
    }

    disconnectedCallback() {
      if (this.socket) {
        this.socket.close();
      }
    }

    toggleChat() {
      this.isOpen = !this.isOpen;
      this.render();
    }

    initWebSocket() {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.addEventListener('message', (event) => {
        const data = event.data;
        this.messages.push(`Server: ${data}`);
        this.renderMessages();
      });

      this.socket.addEventListener('open', () => {
        console.log(`Connected to ${this.wsUrl}`);
        this.messages.push('System: Connected to chat server');
        this.renderMessages();
      });

      this.socket.addEventListener('error', (err) => {
        console.error('WebSocket error:', err);
        this.messages.push('System: Error connecting to chat server');
        this.renderMessages();
      });

      this.socket.addEventListener('close', () => {
        console.log(`Disconnected from ${this.wsUrl}`);
        this.messages.push('System: Disconnected from chat server');
        this.renderMessages();
      });
    }

    sendMessage(msg) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(msg);
      } else {
        console.warn('WebSocket is not open. Message not sent:', msg);
        this.messages.push('System: Unable to send message - not connected');
        this.renderMessages();
      }
    }

    render() {
      if (!this.isOpen) {
        this.shadowRoot.innerHTML = `
          <button 
            class="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
            aria-label="Open chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        `;

        this.shadowRoot.querySelector('button').addEventListener('click', () => this.toggleChat());
      } else {
        this.shadowRoot.innerHTML = `
          <div class="fixed bottom-0 right-0 mb-4 mr-4 w-96 rounded-lg bg-white shadow-2xl transition-all">
            <div class="flex items-center justify-between bg-blue-500 p-4 rounded-t-lg">
              <h2 class="text-xl font-bold text-white">Chat Bdddox</h2>
              <button 
                class="text-white hover:text-gray-200 transition-colors"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div id="messages" class="h-[400px] overflow-y-auto p-4 border-b border-gray-200"></div>
            <form id="messageForm" class="p-4 flex gap-2">
              <input 
                type="text" 
                id="messageInput"
                class="flex-1 px-3 py-2 border border-gray-200 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Type your message..."
              />
              <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Send
              </button>
            </form>
          </div>
        `;

        this.shadowRoot.querySelector('button').addEventListener('click', () => this.toggleChat());
        
        const form = this.shadowRoot.querySelector('#messageForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = this.shadowRoot.querySelector('#messageInput');
          const message = input.value.trim();
          if (message) {
            this.sendMessage(message);
            this.messages.push(`You: ${message}`);
            this.renderMessages();
            input.value = '';
          }
        });

        this.renderMessages();
      }
    }

    renderMessages() {
      const messagesContainer = this.shadowRoot.querySelector('#messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = this.messages
          .map(msg => `<div class="p-2 mb-2 bg-gray-50 rounded-md">${msg}</div>`)
          .join('');
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }

  // Register and inject the component
  if (!customElements.get('chat-box')) {
    customElements.define('chat-box', ChatBox);
    // Auto-inject only if not already present
    if (!document.querySelector('chat-box')) {
      const chatBox = document.createElement('chat-box');
      document.body.appendChild(chatBox);
    }
  }
})();