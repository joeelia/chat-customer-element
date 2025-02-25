// Import Tailwind styles
import s from './styles.css?inline'

// Self-initializing chat widget
window.$chat = [];
(function(d, w) {
  // Default configuration
  const c = {
    wsUrl: 'wss://echo.websocket.org',
    teamId: null,
    title: 'Chat Box',
    position: 'bottom-right',
    theme: {
      primary: 'bg-blue-500',
      hover: 'bg-blue-600'
    }
  };

  // Load configuration from queue
  const g = w.$chat.reduce((a, i) => {
    if (Array.isArray(i) && i[0] === 'config') {
      return { ...a, ...i[1] };
    }
    return a;
  }, c);

  class C extends HTMLElement {
    constructor() {
      super();
      this.m = [];
      this.a = this.attachShadow({ mode: 'open' });
      this.c = g;
      this.o = 0;

      // Add styles to shadow DOM
      const y = new CSSStyleSheet();
      y.replaceSync(s);
      this.a.adoptedStyleSheets = [y];
    }

    connectedCallback() {
      this.i();
      this.r();
      
      // Position the element in the corner
      this.style.cssText = `position:fixed;z-index:9999;${
        this.c.position === 'bottom-left' ? 'bottom:20px;left:20px' :
        this.c.position === 'top-right' ? 'top:20px;right:20px' :
        this.c.position === 'top-left' ? 'top:20px;left:20px' :
        'bottom:20px;right:20px'}`;
    }

    disconnectedCallback() {
      if (this.s) {
        this.s.close();
      }
    }

    toggleChat() {
      this.o = !this.o;
      this.r();
    }

    initWebSocket() {
      // Include teamId in the WebSocket URL if provided
      const u = new URL(this.c.wsUrl);
      if (this.c.teamId) {
        u.searchParams.append('team_id', this.c.teamId);
      }

      this.s = new WebSocket(u.toString());

      this.s.onmessage = (e) => {
        const data = e.data;
        this.m.push(`Server: ${data}`);
        this.n();
      };

      this.s.onopen = () => {
        console.log(`Connected to ${u}`);
        this.m.push('System: Connected to chat server');
        this.n();

        // Send initial configuration if needed
        if (this.c.teamId) {
          this.s.send(JSON.stringify({ 
            type: 'init',
            teamId: this.c.teamId
          }));
        }
      };

      this.s.onerror = () => {
        console.error('WebSocket error:');
        this.m.push('System: Error connecting to chat server');
        this.n();
      };

      this.s.onclose = () => {
        console.log(`Disconnected from ${u}`);
        this.m.push('System: Disconnected from chat server');
        this.n();
      };
    }

    sendMessage(msg) {
      if (this.s && this.s.readyState === WebSocket.OPEN) {
        const message = {
          type: 'message',
          content: msg,
          teamId: this.c.teamId
        };
        this.s.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket is not open. Message not sent:', msg);
        this.m.push('System: Unable to send message - not connected');
        this.n();
      }
    }

    render() {
      if (!this.o) {
        this.a.innerHTML = `
          <button 
            class="w-16 h-16 rounded-full ${this.c.theme.primary} text-white flex items-center justify-center hover:${this.c.theme.hover} transition-colors shadow-lg"
            aria-label="Open chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        `;

        this.a.querySelector('button').onclick = () => this.toggleChat();
      } else {
        this.a.innerHTML = `
          <div class="fixed bottom-0 right-0 mb-4 mr-4 w-96 rounded-lg bg-white shadow-2xl transition-all">
            <div class="flex items-center justify-between ${this.c.theme.primary} p-4 rounded-t-lg">
              <h2 class="text-xl font-bold text-white">${this.c.title}</h2>
              <button 
                class="text-white hover:text-gray-200 transition-colors"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div id="m" class="h-[400px] overflow-y-auto p-4 border-b border-gray-200"></div>
            <form id="f" class="p-4 flex gap-2">
              <input 
                type="text" 
                id="i"
                class="flex-1 px-3 py-2 border border-gray-200 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Type your message..."
              />
              <button type="submit" class="px-4 py-2 ${this.c.theme.primary} text-white rounded-md hover:${this.c.theme.hover} transition-colors">
                Send
              </button>
            </form>
          </div>
        `;

        this.a.querySelector('button').onclick = () => this.toggleChat();
        
        const form = this.a.querySelector('#f');
        form.onsubmit = (e) => {
          e.preventDefault();
          const input = this.a.querySelector('#i');
          const message = input.value.trim();
          if (message) {
            this.sendMessage(message);
            this.m.push(`You: ${message}`);
            this.n();
            input.value = '';
          }
        };

        this.n();
      }
    }

    renderMessages() {
      const messagesContainer = this.a.querySelector('#m');
      if (messagesContainer) {
        messagesContainer.innerHTML = this.m
          .map(msg => `<div class="p-2 mb-2 bg-gray-50 rounded-md">${msg}</div>`)
          .join('');
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }

    n() {
      this.renderMessages();
    }
  }

  // Initialize the chat
  function init() {
    if (!customElements.get('chat-box')) {
      customElements.define('chat-box', C);
      if (!d.querySelector('chat-box')) {
        const chatBox = d.createElement('chat-box');
        d.body.appendChild(chatBox);
      }
    }
  }

  // Convert the queue into a proper API
  const p = w.$chat.push;
  w.$chat.push = (a) => {
    const [method, ...params] = a;
    // Handle any API methods here if needed
    p.apply(w.$chat, [a]);
  };

  // Initialize when the script loads
  init();
})(document, window);