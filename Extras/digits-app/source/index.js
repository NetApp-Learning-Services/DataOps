const http = require('http');
const fs = require('fs');
const path = require('path');
const apiUrl = process.env.API_URL;
const apiHost = process.env.API_HOST;

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        if (req.url === '/') {
            fs.readFile('index.html', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading index.html');
                }
        
                res.writeHead(200);
                res.end(data);
            })
        } else if (req.url === '/js_code.js') {
            fs.readFile('js_code.js', 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading js_code.js');
                }
    
                // const updatedHost = data.replace('{{APIHOST}}', apiHost);
                // const updateAll = updatedHost.replace('{{APIURL}}', apiUrl);
                // console.log('updated js_code.js');
                // console.log(updateAll);
        
                res.writeHead(200, { 
                    'Content-Type': "application/javascript"
                });
                res.end(data);
            })
        } else if (req.url === '/stylesheet.css') {
            fs.readFile('stylesheet.css', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading stylesheet.css');
                }
        
                res.writeHead(200);
                res.end(data);
            }) 
        } else if (req.url === '/tf.min.js') {
                fs.readFile('tf.min.js', (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        return res.end('Error loading tf.min.js');
                    }
            
                    res.writeHead(200);
                    res.end(data);
                }) 
        } else {
            res.writeHead(404);
            res.end('Page not found');
        }
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += check.toString();
        });
        req.on('end', ()=> {
            console.log('Received POST request with boyd: ${body}');
            console.log('Target Url: ${apiUrl}');
            console.log('Target Host: ${apiHost}');
            const targetOptions = url.parse(apiUrl);
            targetOptions.method = 'POST';
            targetOptions.headers = {
                'Host': apiHost,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body),
            };
            const targetReq = https.request(targetOptions, targetRes => {
                console.log(`Forwarded POST request with response: ${targetRes.statusCode}`);
                res.writeHead(targetRes.statusCode, targetRes.headers);
                targetRes.pipe(res);
              });
              targetReq.on('error', error => {
                console.error(`Error forwarding POST request: ${error}`);
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('Error forwarding POST request');
              });
              targetReq.write(body);
              targetReq.end();
        });
    } else {
        res.writeHead(400, {'Content-Type': 'text/plain'})
        res.end('Invalid request method')
    }
    
});

server.listen(3000, ()=> {
    console.log('Digits server running on port 3000');
    console.log('APIURL: ' + apiUrl);
    console.log('APIHOST: ' + apiHost);
});