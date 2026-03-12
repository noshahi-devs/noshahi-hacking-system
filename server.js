const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else if (req.url === '/api/wifi') {
        // Run netsh command to get wifi networks
        exec('netsh wlan show networks mode=bssid', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to scan networks' }));
                return;
            }

            const networks = parseNetshOutput(stdout);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(networks));
        });
    } else {
        // Serve static files if they exist (for images, css, etc if added later)
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }
            res.writeHead(200);
            res.end(content);
        });
    }
});

function parseNetshOutput(output) {
    const networks = [];
    const lines = output.split('\n');
    let currentNetwork = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('SSID ')) {
            if (currentNetwork) {
                networks.push(currentNetwork);
            }
            // Parse SSID
            const parts = line.split(':');
            currentNetwork = {
                name: parts.length > 1 ? parts[1].trim() : 'Unknown',
                security: 'OPEN',
                signal: 0,
                ip: getRandomIP(), // Fake IP just for display
                devices: Math.floor(Math.random() * 10) + 1, // Fake count
                password: 'unknown'
            };
            if (currentNetwork.name === '') {
                currentNetwork.name = 'Hidden Network';
            }
        } else if (currentNetwork && line.startsWith('Authentication')) {
            const authParts = line.split(':');
            if (authParts.length > 1) {
                const auth = authParts[1].trim();
                if (auth.includes('WPA3')) currentNetwork.security = 'WPA3';
                else if (auth.includes('WPA2')) currentNetwork.security = 'WPA2';
                else if (auth.includes('WPA')) currentNetwork.security = 'WPA';
                else if (auth.includes('WEP')) currentNetwork.security = 'WEP';
            }
        } else if (currentNetwork && line.startsWith('Signal')) {
            const signalParts = line.split(':');
            if (signalParts.length > 1) {
                const signalText = signalParts[1].trim().replace('%', '');
                currentNetwork.signal = parseInt(signalText) || 0;
            }
        }
    }

    // Push the last one
    if (currentNetwork) {
        networks.push(currentNetwork);
    }

    return networks;
}

function getRandomIP() {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

server.listen(PORT, () => {
    console.log(`💀 NOSHAHI HACKING SERVER running on http://localhost:${PORT} 💀`);
    console.log(`Scan for WiFi at http://localhost:${PORT}/api/wifi`);
});
