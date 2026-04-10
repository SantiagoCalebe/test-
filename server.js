const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const URL = require('url');

const PORT = 5000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const TRANSLATION_API = 'https://api.mymemory.translated.net/get';
const TTS_API = 'https://api.freetts.org/v1/synthesize';

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname;
    
    if (pathname === '/api/translate') {
        const text = parsedUrl.searchParams.get('text');
        const langPair = parsedUrl.searchParams.get('langpair') || 'en|es';
        
        const url = `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        https.get(url, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    res.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify(json.responseData));
                } catch (e) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Translation failed' }));
                }
            });
        }).on('error', () => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Network error' }));
        });
        return;
    }
    
    if (pathname === '/api/tts') {
        const text = parsedUrl.searchParams.get('text');
        const voice = parsedUrl.searchParams.get('voice') || 'en-US-JennyNeural';
        
        const postData = `text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`;
        
        const options = {
            hostname: 'api.freetts.org',
            path: '/v1/synthesize',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (apiRes) => {
            if (apiRes.statusCode !== 200) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'TTS failed' }));
                return;
            }
            
            res.writeHead(200, { 
                'Content-Type': 'audio/mpeg',
                'Access-Control-Allow-Origin': '*'
            });
            apiRes.pipe(res);
        });
        
        req.on('error', () => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Network error' }));
        });
        
        req.write(postData);
        req.end();
        return;
    }
    
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Permissions-Policy': 'microphone=(self)'
            });
            res.end(content);
        }
    });
});

let sslOptions = null;
if (fs.existsSync('cert.pem') && fs.existsSync('key.pem')) {
    sslOptions = {
        cert: fs.readFileSync('cert.pem'),
        key: fs.readFileSync('key.pem')
    };
}

function getLocalIP() {
    const {networkInterfaces} = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();

console.log('=========================================================');
console.log('Voice Translator');
console.log('=========================================================');
console.log('');
console.log(`PC:           http://localhost:${PORT}`);
console.log(`Phone local:  https://${localIP}:5443`);
console.log('');

let serveoUrl = null;

function startServeo() {
    console.log('Starting serveo tunnel...');
    
    const serveo = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-R', `80:localhost:${PORT}`, 'serveo.net'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    serveo.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Forwarding HTTP')) {
            serveoUrl = output.match(/https:\/\/[a-zA-Z0-9.-]+/)[0];
            console.log('');
            console.log('=========================================================');
            console.log('=== OPEN THIS URL ON YOUR PHONE ===');
            console.log(serveoUrl);
            console.log('=========================================================');
            console.log('');
        }
    });

    serveo.stderr.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('Warning: Permanently added')) {
            console.log(output.trim());
        }
    });

    serveo.on('close', (code) => {
        console.log(`Tunnel closed, restarting in 3s...`);
        setTimeout(startServeo, 3000);
    });
}

startServeo();

if (sslOptions) {
    https.createServer(sslOptions, (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Permissions-Policy', 'microphone=(self)');
        
        let filePath = req.url === '/' ? '/index.html' : req.url;
        filePath = path.join(__dirname, filePath);

        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'text/plain';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Not Found');
                } else {
                    res.writeHead(500);
                    res.end('Server Error');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    }).listen(5443, '0.0.0.0', () => {
        console.log(`HTTPS running on port 5443`);
    });
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP running on port ${PORT}`);
    console.log('');
});

process.on('SIGINT', () => {
    process.exit();
});