const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-engine-btn');
const wsStatus = document.getElementById('ws-status');
const loadingText = document.getElementById('loading');
const steeringVisual = document.getElementById('steering-wheel');
const angleValueDisplay = document.getElementById('angle-value');
const brakeLight = document.getElementById('brake-light');

let websocket = null;
let isTracking = false;

// 1. WebSocket Setup
function connectWebSocket() {
    websocket = new WebSocket('ws://localhost:8000');
    
    websocket.onopen = () => {
        wsStatus.textContent = 'Connected';
        wsStatus.classList.replace('disconnected', 'connected');
    };
    
    websocket.onclose = () => {
        wsStatus.textContent = 'Disconnected';
        wsStatus.classList.replace('connected', 'disconnected');
        // Attempt to reconnect every 3 seconds if lost
        setTimeout(connectWebSocket, 3000);
    };
    
    websocket.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}

// Send telemetry to the Controler file
function sendTelemetry(angle, brake) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
            angle: parseFloat(angle.toFixed(3)),
            brake: brake
        }));
    }
}

// 2. Gesture Logic
function checkFist(landmarks) {
    // Check if the tips of the fingers are lower than their middle joints
    // Landmarks: 8 (Index Tip), 6 (Index PIP), 12 (Middle Tip), 10 (Middle PIP)
    const indexCurled = landmarks[8].y > landmarks[6].y;
    const middleCurled = landmarks[12].y > landmarks[10].y;
    return indexCurled && middleCurled;
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    let currentAngle = 0;
    let isBraking = false;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        
        // Draw the hands
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00ff00', lineWidth: 2});
            drawLandmarks(canvasCtx, landmarks, {color: '#00f3ff', lineWidth: 1, radius: 2});
        }

        // Logic for Steering (Requires 2 hands)
        if (results.multiHandLandmarks.length === 2) {
            // Get wrist coordinates for both hands
            const hand1 = results.multiHandLandmarks[0][0]; 
            const hand2 = results.multiHandLandmarks[1][0]; 

            // Sort left and right based on X coordinate
            // Note: Camera is mirrored, so logic flips visually
            const leftHand = hand1.x > hand2.x ? hand1 : hand2;
            const rightHand = hand1.x > hand2.x ? hand2 : hand1;

            // Calculate angle between wrists
            const dy = rightHand.y - leftHand.y;
            const dx = rightHand.x - leftHand.x;
            
            // Raw angle in radians
            let radians = Math.atan2(dy, dx);
            
            // Map the angle (Clamp between -1.0 and 1.0)
            // Roughly -0.5 to +0.5 radians is a comfortable steering range
            currentAngle = Math.max(-1.0, Math.min(1.0, radians * 2));

            // Draw visual steering line on canvas
            canvasCtx.beginPath();
            canvasCtx.moveTo(leftHand.x * canvasElement.width, leftHand.y * canvasElement.height);
            canvasCtx.lineTo(rightHand.x * canvasElement.width, rightHand.y * canvasElement.height);
            canvasCtx.strokeStyle = '#00f3ff';
            canvasCtx.lineWidth = 3;
            canvasCtx.stroke();
        }

        // Logic for Braking (Check if ANY hand is closed into a fist)
        for (const landmarks of results.multiHandLandmarks) {
            if (checkFist(landmarks)) {
                isBraking = true;
                break; // One hand braking is enough
            }
        }
    }
    canvasCtx.restore();

    // 3. Update UI Dashboards
    steeringVisual.style.transform = `rotate(${currentAngle * 45}deg)`;
    angleValueDisplay.innerText = currentAngle.toFixed(2);
    
    if (isBraking) {
        brakeLight.classList.add('brake-active');
        brakeLight.innerText = 'BRAKE';
    } else {
        brakeLight.classList.remove('brake-active');
        brakeLight.innerText = 'OFF';
    }

    // 4. Send to Backend
    sendTelemetry(currentAngle, isBraking);
}

// 3. MediaPipe Setup
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});
hands.onResults(onResults);

// 4. Start Engine Trigger
startBtn.addEventListener('click', async () => {
    if (isTracking) return;
    
    startBtn.innerText = "Engine Running...";
    startBtn.style.color = "#00ff00";
    startBtn.style.borderColor = "#00ff00";
    loadingText.classList.remove('hidden');

    // Resize internal canvas to match video container
    canvasElement.width = 800;
    canvasElement.height = 450;

    // Start WebSocket
    connectWebSocket();

    // Start Camera feed to MediaPipe
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
            loadingText.classList.add('hidden'); // Hide loading once frames arrive
        },
        width: 800,
        height: 450
    });
    
    camera.start();
    isTracking = true;
});