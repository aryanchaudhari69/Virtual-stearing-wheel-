const http = require('http');
const fs = require('fs');
const path = require('path');

const HTTP_PORT = 3000;

// ==========================================
// HTTP STATIC FILE SERVER ONLY (PORT 3000)
// WebSocket is handled by Controler.py (port 8000)
// ==========================================
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const httpServer = http.createServer((req, res) => {
    const reqUrl = req.url.split('?')[0];
    let safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = 'index.html';
    }

    const filePath = path.join(__dirname, safePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
    });
});

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`[HTTP] CyberWheel HUB serving at http://localhost:${HTTP_PORT}/`);
    console.log(`[INFO] Now start Controler.py separately to bridge hand gestures -> game keys.`);
});
