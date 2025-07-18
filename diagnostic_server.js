console.log('=== optqo Server Diagnostic ===');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

console.log('\n=== Checking dependencies ===');
try {
    const express = require('express');
    console.log('✓ Express found (CommonJS)');
} catch (e) {
    console.log('✗ Express not found with require()');
    try {
        const express = await import('express');
        console.log('✓ Express found (ES modules)');
    } catch (e2) {
        console.log('✗ Express not found with import()');
        console.log('Error:', e2.message);
    }
}

console.log('\n=== Testing basic HTTP server ===');
import http from 'http';

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Diagnostic server working!');
});

server.listen(3001, () => {
    console.log('✓ Basic HTTP server running on http://localhost:3001');
    console.log('If you see this, Node.js HTTP functionality works');
    console.log('Press Ctrl+C to stop');
});

server.on('error', (err) => {
    console.log('✗ Server error:', err.message);
});
