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

This will create a `dist` folder containing `chat-element.js` which you can upload to your CDN.

## Usage

Add the following script to your website's `<head>` section:

```html
<script type="text/javascript">
  window.$chat = [];
  window.CHAT_TEAM_ID = "YOUR-TEAM-ID";
  (function() {
    // Configure the chat
    window.$chat.push(['config', {
      teamId: window.CHAT_TEAM_ID,
      wsUrl: 'wss://your-websocket-server.com',
      title: 'Support Chat',
      position: 'bottom-right',
      theme: {
        primary: 'bg-indigo-600',
        hover: 'bg-indigo-700'
      }
    }]);

    // Load the script
    d = document;
    s = d.createElement("script");
    s.src = "https://your-domain.com/chat-element.js";
    s.type = "module";
    s.async = 1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>
```

Replace `https://your-domain.com/chat-element.js` with the actual URL where you've hosted the chat component.

## Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `teamId` | string | `null` | Your team's unique identifier |
| `wsUrl` | string | `'wss://echo.websocket.org'` | WebSocket server URL |
| `title` | string | `'Chat Box'` | Title displayed in the chat header |
| `position` | string | `'bottom-right'` | Widget position (`'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'`) |
| `theme.primary` | string | `'bg-blue-500'` | Primary color using Tailwind classes |
| `theme.hover` | string | `'bg-blue-600'` | Hover color using Tailwind classes |

## Features

- 🎨 Customizable theme using Tailwind CSS classes
- 📱 Responsive design
- 🔒 Shadow DOM for style isolation
- 🔌 WebSocket integration
- 🚀 Lightweight and performant
- 🔥 Hot Module Reload during development
- 📦 Easy to embed

## Browser Support

Works in all modern browsers that support Web Components:
- Chrome/Edge (Chromium)
- Firefox
- Safari

## License

MIT
