import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import bodyParser from 'body-parser';

const __dirname = path.resolve(path.dirname(''));
const app = express();
const apiUrl = process.env.API_URL;
console.log('apiUrl: ' + apiUrl);

app.use(express.static('public'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(bodyParser.text({ limit: '200mb' }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/page/index.html'));
});

app.get('/jquery-3-3-1.min.js', (req, res) => {
    res.type("application/javascript");
    res.sendFile(path.join(__dirname, '/page/jquery-3-3-1.min.js'));
});

app.get('/prediction.js', (req, res) => {
    res.type("application/javascript");
    res.sendFile(path.join(__dirname, '/page/prediction.js'));
});

app.get('/chart.min.js', (req, res) => {
    res.type("application/javascript");
    res.sendFile(path.join(__dirname, '/page/chart.min.js'));
});

app.get('/tf.min.js', (req, res) => {
    res.type("application/javascript");
    res.sendFile(path.join(__dirname, '/page/tf.min.js'));
});

app.get('/stylesheet.css', (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, '/page/stylesheet.css'));
});

async function getData(tensor) {
    try {
        const response = await fetch(apiUrl,{
            method: 'POST',
            body: tensor,
        });
        const json = await response.json();
        console.log('json: ' + json);
        return json;
    } catch (err) {
        console.log(err);
        return 'Something went wrong with the predict endpoint';
    }
}

app.post('/predict', async (req, res) => {
    const tensor = JSON.stringify(req.body);
    console.log('/predict received: ' + tensor);
    try {
        const data = await getData(tensor);
        console.log('json data: ' + JSON.stringify(data));
        const predictions = data.predictions && data.predictions[0];
        var predictedDigit = 0;
        if (predictions) {
            predictedDigit = predictions.indexOf(Math.max(...predictions));
            console.log("Predicted result: ", predictedDigit);
          }
        res.set("Content-type", "application/json");
        res.status(200).send(JSON.stringify(data));
    } catch (err) {
        console.log(err);
        res.status(500).send('Something went wrong with the predict endpoint');
    } 
})

app.listen(3000, () => {
    console.log("Web server started on port 3000");
})