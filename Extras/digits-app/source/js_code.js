const canvas = document.getElementById('number-drawing');
const ctx = canvas.getContext('2d');
// const apiHost = {{APIHOST}};
// const apiUrl = {{APIURL}};

// console.log('apiUrl: ' + apiUrl);
// console.log('apiHost: ' + apiHost);

let isPainting = false;
let lineWidth = 15;
let startX;
let startY;

/* offset for the canvas
height: 60px;
margin-left:10px;
*/
let offsetY = 60;
let offsetX = 10;

addEventListener('click', e => {
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (e.target.id === 'detect') {
        console.log("clicked");

        // Creating new canvas, scale to 28x28px image
        const scaled_canvas = document.createElement("canvas");
        scaled_canvas.width = 28;
        scaled_canvas.height = 28;

        const img_tensor = tf.browser.fromPixels(scaled_canvas,2);
        const img_reshaped = img_tensor.reshape([-1,28, 28,1]);

        
        img_data = {
            "instances" : img_reshaped.array()
        }

        console.log(img_data);
        const domain = window.location.host;
        console.log(domain);


        fetch(domain, {
            method: 'POST',
            // headers: {
            //     'Host': apiHost
            // },
            body: JSON.stringify(img_data)
        })
        .then(response => response)
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });

        document.getElementById("results").innerHTML = "Example Output"; //Output still needs to be formatted!
    }
});

const draw = (e) => {
    if(!isPainting) {
        return;
    }

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    ctx.lineTo(e.clientX - offsetX, e.clientY - offsetY);
    ctx.stroke();
}

canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    startX = e.clientX;
    startY = e.clientY;
});

canvas.addEventListener('mouseup', e => {
    isPainting = false;
    ctx.stroke();
    ctx.beginPath();
});

canvas.addEventListener('mousemove', draw);
