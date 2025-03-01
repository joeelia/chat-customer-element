// Import Tailwind styles
import styles from './styles.css?inline'

// Self-initializing chat widget
(function() {
  class ChatBox extends HTMLElement {
    constructor() {
      super();
      this.messages = [];
      this.attachShadow({ mode: 'open' });
      this.teamId = null;
      this.config = {
        title: 'Chat Box',
        position: 'bottom-right',
        hexCode: '#3B82F6' // Default blue color
      };
      this.isOpen = false;
      this.isLoading = true;
      this.currentStreamingMessage = null;

      // Add styles to shadow DOM
      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(styles);
      this.shadowRoot.adoptedStyleSheets = [styleSheet];
    }

    async connectedCallback() {
      this.teamId = this.getAttribute('team-id') || window.AI_CHAT_TEAM_ID || window.CHAT_TEAM_ID;
      
      if (!this.teamId) {
        console.error('Chat component requires a team ID (set window.AI_CHAT_TEAM_ID)');
        return;
      }

      // Position the element in the corner
      this.style.position = 'fixed';
      this.style.zIndex = '9999';
      
      // Fetch configuration from API
      await this.fetchConfig();
      
      // Apply positioning based on config
      switch(this.config.position) {
        case 'bottom-left':
          this.style.bottom = '20px';
          this.style.left = '20px';
          break;
        case 'top-right':
          this.style.top = '20px';
          this.style.right = '20px';
          break;
        case 'top-left':
          this.style.top = '20px';
          this.style.left = '20px';
          break;
        default: // bottom-right
          this.style.bottom = '20px';
          this.style.right = '20px';
      }
      
      // Add welcome message
      const welcomeMessage = 'Hello! I\'m your legal assistant with access to this firm\'s information. How can I help you today?';
      this.messages.push(`Assistant: ${welcomeMessage}`);
      
      this.render();
      
      // Only fetch initial messages if we don't have a welcome message
      if (this.messages.length === 0) {
        this.fetchInitialMessages();
      } else {
        this.isLoading = false;
      }
    }

    async fetchConfig() {
      try {
        const response = await fetch(`https://v3.notthebestagency.com/api/teams/${this.teamId}/business-details?chatbot`, {
          credentials: 'omit', // Don't send credentials for cross-origin requests
          mode: 'cors' // Explicitly set CORS mode
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.chatbot) {
          this.config = {
            title: data.chatbot.title || 'Chat Box',
            position: data.chatbot.position || 'bottom-right',
            hexCode: data.chatbot.hexCode || '#3B82F6'
          };
        }
        
        this.isLoading = false;
      } catch (error) {
        console.error('Error fetching chat configuration:', error);
        this.isLoading = false;
      }
    }

    async fetchInitialMessages() {
      try {
        const response = await fetch(`https://v3.notthebestagency.com/api/chatbot/${this.teamId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'omit', // Don't send credentials for cross-origin requests
          mode: 'cors', // Explicitly set CORS mode
          body: JSON.stringify({
            messages: []
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        // Add placeholder for streaming response
        this.currentStreamingMessage = 'Assistant: ';
        this.messages.push(this.currentStreamingMessage);
        this.renderMessages();
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // Replace the placeholder with the streaming message
        const streamingIndex = this.messages.indexOf(this.currentStreamingMessage);
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Process the chunk to extract response text
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data:')) {
              try {
                // Extract the JSON part
                const jsonStr = line.trim().substring(5).trim();
                
                // Skip [DONE] marker
                if (jsonStr === '[DONE]') continue;
                
                // Parse the JSON
                const data = JSON.parse(jsonStr);
                
                // Extract just the response field
                if (data.response !== undefined) {
                  this.currentStreamingMessage += data.response;
                  
                  // Update the message in the array
                  if (streamingIndex !== -1) {
                    this.messages[streamingIndex] = this.currentStreamingMessage;
                    this.renderMessages();
                  }
                }
              } catch (e) {
                console.warn('Error parsing streaming data:', e);
              }
            }
          }
        }
        
        // Finalize the message
        this.currentStreamingMessage = null;
      } catch (error) {
        console.error('Error fetching initial messages:', error);
        
        // Remove streaming message if it exists
        if (this.currentStreamingMessage) {
          const index = this.messages.indexOf(this.currentStreamingMessage);
          if (index !== -1) {
            this.messages.splice(index, 1);
          }
          this.currentStreamingMessage = null;
        }
        
        this.messages.push('System: Unable to load initial messages');
        this.renderMessages();
      }
    }

    toggleChat() {
      this.isOpen = !this.isOpen;
      this.render();
    }

    async sendMessage(msg) {
      try {
        // Add user message to chat
        this.messages.push(`You: ${msg}`);
        this.renderMessages();
        
        // Prepare message history for API
        const apiMessages = this.prepareMessagesForAPI(msg);
        
        // Add placeholder for streaming response
        this.currentStreamingMessage = 'Assistant: ';
        this.messages.push(this.currentStreamingMessage);
        this.renderMessages();
        
        // Make streaming request
        const apiEndpoint = `https://v3.notthebestagency.com/api/chatbot/${this.teamId}`;
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'omit', // Don't send credentials for cross-origin requests
          mode: 'cors', // Explicitly set CORS mode
          body: JSON.stringify({
            messages: apiMessages
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // Replace the placeholder with the streaming message
        const streamingIndex = this.messages.indexOf(this.currentStreamingMessage);
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Process the chunk to extract response text
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data:')) {
              try {
                // Extract the JSON part
                const jsonStr = line.trim().substring(5).trim();
                
                // Skip [DONE] marker
                if (jsonStr === '[DONE]') continue;
                
                // Parse the JSON
                const data = JSON.parse(jsonStr);
                
                // Extract just the response field
                if (data.response !== undefined) {
                  this.currentStreamingMessage += data.response;
                  
                  // Update the message in the array
                  if (streamingIndex !== -1) {
                    this.messages[streamingIndex] = this.currentStreamingMessage;
                    this.renderMessages();
                  }
                }
              } catch (e) {
                console.warn('Error parsing streaming data:', e);
              }
            }
          }
        }
        
        // Finalize the message
        this.currentStreamingMessage = null;
        
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove streaming message if it exists
        if (this.currentStreamingMessage) {
          const index = this.messages.indexOf(this.currentStreamingMessage);
          if (index !== -1) {
            this.messages.splice(index, 1);
          }
          this.currentStreamingMessage = null;
        }
        
        this.messages.push('System: Error sending message');
        this.renderMessages();
      }
    }
    
    prepareMessagesForAPI(currentMessage) {
      // Convert chat history to API format
      const apiMessages = [];
      
      // Add previous messages
      for (const msg of this.messages) {
        if (msg.startsWith('You: ')) {
          apiMessages.push({
            role: 'user',
            content: msg.substring(5)
          });
        } else if (msg.startsWith('Assistant: ')) {
          apiMessages.push({
            role: 'assistant',
            content: msg.substring(11)
          });
        }
      }
      
      // Check if the last message is already the current message
      const lastMessage = apiMessages[apiMessages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== currentMessage) {
        // Only add the current message if it's not already the last message
        apiMessages.push({
          role: 'user',
          content: currentMessage
        });
      }
      
      return apiMessages;
    }

    hexToRgb(hex) {
      // Remove the hash if it exists
      hex = hex.replace(/^#/, '');
      
      // Parse the hex values
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      
      return { r, g, b };
    }

    generateColorClasses(hexCode) {
      // Convert hex to RGB
      const rgb = this.hexToRgb(hexCode);
      
      // Create CSS variables for the colors
      const style = document.createElement('style');
      style.textContent = `
        :host {
          --primary-color: ${hexCode};
          --primary-hover: ${this.adjustBrightness(hexCode, -10)};
          --primary-text: ${this.getContrastColor(rgb)};
        }
      `;
      
      return style;
    }

    adjustBrightness(hex, percent) {
      // Remove the hash if it exists
      hex = hex.replace(/^#/, '');
      
      // Parse the hex values
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);
      
      // Adjust brightness
      r = Math.max(0, Math.min(255, r + percent));
      g = Math.max(0, Math.min(255, g + percent));
      b = Math.max(0, Math.min(255, b + percent));
      
      // Convert back to hex
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    getContrastColor({ r, g, b }) {
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return black or white based on luminance
      return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    render() {
      if (this.isLoading) {
        this.shadowRoot.innerHTML = `
          <button 
            class="w-16 h-16 rounded-full bg-gray-300 text-white flex items-center justify-center shadow-lg"
            aria-label="Loading chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        `;
        return;
      }
      
      // Add color styles
      const colorStyle = this.generateColorClasses(this.config.hexCode);
      this.shadowRoot.appendChild(colorStyle);
      
      if (!this.isOpen) {
        this.shadowRoot.innerHTML = `
          <button 
            class="w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg"
            style="background-color: ${this.config.hexCode}; color: ${this.getContrastColor(this.hexToRgb(this.config.hexCode))};"
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
            <div class="flex items-center justify-between p-4 rounded-t-lg" 
                 style="background-color: ${this.config.hexCode}; color: ${this.getContrastColor(this.hexToRgb(this.config.hexCode))};">
              <h2 class="text-xl font-bold">${this.config.title}</h2>
              <button 
                class="hover:opacity-80 transition-opacity"
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
                class="flex-1 px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2"
                style="focus-border-color: ${this.config.hexCode}; focus-ring-color: ${this.config.hexCode};"
                placeholder="Type your message..."
              />
              <button type="submit" class="px-4 py-2 rounded-md transition-colors"
                      style="background-color: ${this.config.hexCode}; color: ${this.getContrastColor(this.hexToRgb(this.config.hexCode))};">
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
          .map(msg => {
            const isAssistant = msg.startsWith('Assistant:');
            const isSystem = msg.startsWith('System:');
            const isUser = msg.startsWith('You:');
            
            let bgColor = 'bg-gray-50';
            if (isAssistant) {
              bgColor = 'bg-blue-50';
            } else if (isSystem) {
              bgColor = 'bg-yellow-50';
            } else if (isUser) {
              bgColor = 'bg-green-50';
            }
            
            // Add blinking cursor for streaming message
            let content = msg;
            if (this.currentStreamingMessage === msg) {
              content += '<span class="inline-block w-2 h-4 bg-black ml-1 animate-pulse"></span>';
            }
            
            return `<div class="p-2 mb-2 ${bgColor} rounded-md">${content}</div>`;
          })
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