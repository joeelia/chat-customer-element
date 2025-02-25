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

  // Copy the production index.html
  await fs.copyFile(
    path.join(__dirname, 'src/index.prod.html'),
    path.join(__dirname, 'dist/index.html')
  );

  console.log('Build completed successfully!');
}

buildProject().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
}); 