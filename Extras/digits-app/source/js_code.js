const canvas = document.getElementById('number-drawing');
const ctx = canvas.getContext('2d');

let isPainting = false;
let lineWidth = 15;
let startX;
let startY;

// offset for the canvas
let offsetY = 60;
let offsetX = 10;

addEventListener('click', e => {
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (e.target.id === 'detect') {
        console.log("clicked");

        // Creating new canvas, scale to 28x28px image
        const canvas = document.getElementById('number-drawing');
        const ctx = canvas.getContext('2d');
        ctx.scale(28, 28);
        const scaled_canvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const img_tensor = tf.browser.fromPixels(scaled_canvas,2);
        const img_reshaped = img_tensor.reshape([-1,28, 28,1]);
    
        img_data = {
            "instances" : img_reshaped.arraySync()
        }

        console.log(img_data);

        const domain = window.location.origin + '/predict';

        fetch(domain, {
            method: 'POST',
            body: JSON.stringify(img_data),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response)
        .then(data => {
            console.log('Success:', data);
            document.getElementById("value").textContent = "Data: " + data[0];
        })
        .catch((error) => {
            console.error('Error:', error);
        });

        document.getElementById("results").innerHTML = "Prediction Output"; 
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
