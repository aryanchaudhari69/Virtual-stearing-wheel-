# 🏎️ Virtual Steering Wheel HUD

A real-time, computer vision-powered virtual steering wheel that translates webcam hand gestures into keyboard and gamepad inputs. Designed to play any racing game—from browser-based titles like *Racing Limits* on CrazyGames to full desktop simulators—using just your hands.

## ✨ Features
* **Real-Time Hand Tracking:** Utilizes Google's MediaPipe to detect wrist and finger landmarks at 30+ FPS directly in the browser.
* **Analog Steering:** Calculates the exact tilt angle between your left and right hands for smooth, proportional cornering.
* **Fist-to-Brake:** Detects a closed-fist gesture to instantly release the gas and apply the brakes.
* **Auto-Acceleration:** Automatically holds the gas pedal down while your hands are in the driving position to reduce fatigue.
* **Universal Game Compatibility:** Injects standard WASD keystrokes natively into the OS (via `pynput`), making it compatible with almost any racing game without needing special APIs.

## 🛠️ Tech Stack
* **Frontend:** HTML, CSS, JavaScript (MediaPipe Hands API)
* **Backend:** Python 3
* **Libraries:** `websockets` (communication bridge), `pynput` (keyboard injection), `vgamepad` (optional Xbox 360 controller emulation)

## 🚀 Installation & Setup

### Prerequisites
* Python 3.8 or higher installed on your system.
* A working webcam.

### 1. Install Dependencies
Open your terminal or command prompt and install the required Python libraries:
```bash
pip install websockets pynput
```

### 2. Start the Backend Server
Navigate to the project directory and run the controller script. This script listens for gesture data and translates it into keystrokes.
```bash
python Controler.py
```
*You should see a message indicating the server is waiting for a WebSocket connection on port 8000.*

### 3. Launch the Frontend HUD
1. Open the `index.html` file in a modern web browser (Chrome or Edge recommended). 
2. Click the **Start Engine** button.
3. Allow the browser permission to access your webcam.

### 4. Drive!
1. Open your racing game (e.g., *Racing Limits* on CrazyGames).
2. **Crucial:** Click inside the game window so it is the active, focused window on your operating system.
3. Hold your hands up to the camera to auto-accelerate (`W`). Tilt left/right to steer (`A`/`D`). Ball your hands into fists to brake (`S`).

## ⚙️ Calibration & Configuration
You can fine-tune the steering sensitivity to match your posture and camera angle by editing the variables at the top of `Controler.py`:

* `CENTER_OFFSET` (Default `0.0`): Adjust this if your car naturally drifts straight. If your resting hands register as `+0.15`, set this to `0.15` to zero it out.
* `STEERING_DEADZONE` (Default `0.25`): The safe zone. Increase this to prevent twitchy steering from minor handshakes.
* `STEERING_THRESHOLD` (Default `0.45`): How far you must physically tilt your hands to trigger a turn. Lower this for a more sensitive wheel.

## 🔧 Troubleshooting
* **`[Errno 10048] Address already in use`:** This means a previous instance of the script didn't close properly and is blocking port 8000. Open your terminal and run `netstat -ano | findstr :8000` to find the Process ID (PID), then kill it using `taskkill /PID <PID_NUMBER> /F`.
* **Car isn't moving in-game:** Ensure your game window is the actively focused window. `pynput` only sends keystrokes to the window your operating system is currently focused on.
* **Camera tracking freezes:** Disable "Window Occlusion" or "Efficiency Mode" in your browser settings so the webcam tab doesn't get throttled when you play your game in full screen.
