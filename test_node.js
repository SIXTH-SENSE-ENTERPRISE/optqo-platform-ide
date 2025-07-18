console.log('Testing Node.js...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Simple HTTP server test
import http from 'http';

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
            <head><title>Test Server</title></head>
            <body>
                <h1>Node.js is working!</h1>
                <p>If you see this, Node.js is running correctly.</p>
                <p>Node version: ${process.version}</p>
            </body>
        </html>
    `);
});

server.listen(3000, () => {
    console.log('Simple test server running on http://localhost:3000');
    console.log('If you see this message, Node.js is working correctly');
});
