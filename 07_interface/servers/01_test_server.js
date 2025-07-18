// Simple test server
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>optqo Platform Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .logo { font-size: 48px; margin-bottom: 20px; }
        .status { color: #4CAF50; font-size: 24px; margin: 20px 0; }
        .link { 
            display: inline-block; 
            padding: 12px 24px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀 optqo Platform</div>
        <div class="status">✅ Server is Running!</div>
        <p>The web server is working correctly.</p>
        <a href="/14_gui/01_optqo_interface.html" class="link">🖥️ Open Full Interface</a>
        <a href="#" onclick="location.reload()" class="link">🔄 Refresh</a>
    </div>
</body>
</html>
    `);
});

server.listen(3000, () => {
    console.log('✅ Test server running on http://localhost:3000');
    console.log('🌐 You can open this in your browser');
});
