import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import bodyParser from 'body-parser';
import jp from 'jsonpath';

const __dirname = path.resolve(path.dirname(''));
const app = express();
const apiUrl = 'https://rickandmortyapi.com/api/character/2'; // process.env.API_URL;

app.use(express.static('public'));
// app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(bodyParser.text({ limit: '200mb' }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/js_code.js', (req, res) => {
    res.type("application/javascript");
    res.sendFile(path.join(__dirname, 'js_code.js'));
});

app.get('/stylesheet.css', (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, 'stylesheet.css'));
});

app.post('/predict', async (req, res) => {
    const tensor = req.body;
    //console.log('/predict received: ' + JSON.stringify(req.body));
    const response = await fetch(apiUrl,{
        method: 'POST',
        body: JSON.stringify(tensor),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();
    const value = result.predictions[0].prediction;
    const scores = result.predictions[0].scores;
    console.log('value: ' + value.toString());
    console.log('scores: ' + scores.toString());
    res.text(value);
})

app.listen(3000, () => {
    console.log("Web server started on port 3000");
})