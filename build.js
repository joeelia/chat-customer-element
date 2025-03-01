const fs = require('fs').promises;
const path = require('path');
const { build } = require('vite');

async function buildProject() {
  // Build the component
  await build();

  // Rename the output file to .js extension
  await fs.rename(
    path.join(__dirname, 'dist/chat-element.mjs'),
    path.join(__dirname, 'dist/chat-element.js')
  ).catch(() => {
    // File might already be named correctly
  });

  // Create the embed script
  const embedScript = `<script type="text/javascript">
  window.AI_CHAT_TEAM_ID = "YOUR-TEAM-ID";
  
  (function() {
    const d = document;
    const s = d.createElement("script");
    s.src = "chat-element.js";
    s.type = "module";
    s.async = 1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>`;

  // Create a demo HTML file with the embed script
  const demoHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chat Component Demo</title>
    ${embedScript.replace('YOUR-TEAM-ID', 'Fls9e8qMngIGfSaVVxLtf')}
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #f3f4f6;
        padding: 20px;
      }
    </style>
  </head>
  <body>
    <h1 style="font-family: system-ui; color: #374151;">Chat Widget Demo Page</h1>
    <p style="font-family: system-ui; color: #374151; text-align: center; max-width: 600px; margin: 0 auto;">
      This is a demo of the chat widget. The widget is loaded with the team ID "Fls9e8qMngIGfSaVVxLtf".<br>
      You can customize the embed code for your own website by editing the AI_CHAT_TEAM_ID value.
    </p>
  </body>
</html>`;

  // Write the demo HTML to a file
  await fs.writeFile(
    path.join(__dirname, 'dist/index.html'),
    demoHtml
  );

  console.log('Build completed successfully!');
}

buildProject().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
}); 