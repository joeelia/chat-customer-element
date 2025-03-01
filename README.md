# Chat Web Component

A lightweight, customizable chat widget (~13kb minified and 3kb gzipped) that can be easily embedded into any website. Built with Web Components and Tailwind CSS.

## Development

```bash
# Install dependencies
pnpm install

# Start development server with HMR (Hot Module Reload)
pnpm dev
```

The development server will start at `http://localhost:3000` with hot module reloading enabled for rapid development.

## Building for Production

```bash
# Build the component
pnpm build
```

This will create a `dist` folder containing:
- `chat-element.js` - The main component file to be hosted on your CDN
- `index.html` - A demo page showing the chat widget in action
- `embed-code.html` - A page with the embed code and copy button for easy integration

## Usage

Add the following script to your website's `<head>` section:

```html
<script type="text/javascript">
  // Set your team ID
  window.AI_CHAT_TEAM_ID = "YOUR-TEAM-ID";
  
  (function() {
    const d = document;
    const s = d.createElement("script");
    s.src = "https://your-domain.com/chat-element.js";
    s.type = "module";
    s.async = 1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>
```

Replace `YOUR-TEAM-ID` with your actual team ID and `https://your-domain.com/chat-element.js` with the actual URL where you've hosted the chat component.

## How It Works

1. The chat widget automatically fetches configuration from `https://v3.notthebestagency.com/api/teams/{teamId}/business-details?chatbot`
2. It uses the configuration to customize the appearance (title, position, colors)
3. Messages are sent to and received from `https://v3.notthebestagency.com/api/chatbot/{teamId}` with streaming responses
4. The widget displays with a floating button that expands into a chat interface when clicked
5. Responses are streamed in real-time with a blinking cursor indicator

## Features

- 🎨 Automatically themed based on your team's configuration
- 📱 Responsive design
- 🔒 Shadow DOM for style isolation
- 🚀 Lightweight and performant
- 🔥 Hot Module Reload during development
- 📦 Easy to embed with just your team ID
- 💬 Real-time streaming responses
- 🧠 Maintains conversation context

## Configuration

The widget automatically loads configuration from the API based on your team ID. The following settings are supported:

| Property | Description |
|----------|-------------|
| `title` | Title displayed in the chat header |
| `position` | Widget position (`'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'`) |
| `hexCode` | Primary color for the chat widget (e.g., `'#F60'`) |

## Browser Support

Works in all modern browsers that support Web Components:
- Chrome/Edge (Chromium)
- Firefox
- Safari

## License

MIT
