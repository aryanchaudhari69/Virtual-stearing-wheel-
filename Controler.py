import asyncio
import json
import websockets
import sys
from pynput.keyboard import Controller, Key

# Initialize the OS-level keyboard simulator
keyboard = Controller()

# =====================================================================
# ⚙️ CALIBRATION & CONFIGURATION
# =====================================================================
CENTER_OFFSET = 0.0        # Center calibration offset
STEERING_DEADZONE = 0.12   # Deadzone: hands level = drive straight
STEERING_THRESHOLD = 0.25  # Lower threshold for responsive turning in web games
AUTO_ACCELERATE = True     # Holds Gas automatically when not braking
SEND_ARROW_KEYS = True     # Also send Arrow Keys alongside WASD (ensures all games work!)

# Dual-key mappings: each action triggers both WASD and Arrow/Space keys
ACTION_KEYS = {
    'gas': ['w', Key.up],
    'brake': ['s', Key.down, Key.space],
    'left': ['a', Key.left],
    'right': ['d', Key.right]
}

# Track action states
action_states = {
    'gas': False,
    'brake': False,
    'left': False,
    'right': False
}

def set_action(action, press_state):
    """Presses or releases all associated keys for an action when state changes."""
    global action_states
    if press_state != action_states[action]:
        action_states[action] = press_state
        for key in ACTION_KEYS[action]:
            try:
                if press_state:
                    keyboard.press(key)
                else:
                    keyboard.release(key)
            except Exception:
                pass

def release_all():
    """Safety release of all simulated keys."""
    for action in action_states:
        set_action(action, False)

# =====================================================================
# 🌐 WEBSOCKET SERVER & TELEMETRY HANDLER
# =====================================================================
async def handle_telemetry(websocket):
    addr = websocket.remote_address
    print(f"\n[CONNECTED] Camera HUD linked from {addr}")
    print("=" * 60)
    print("🎮 HOW TO PLAY:")
    print("   1. Open your driving game (CrazyGames, Poki, etc.) in a browser tab")
    print("   2. Click on the game screen so it has keyboard focus")
    print("   3. Both WASD and ARROW KEYS are automatically simulated!")
    print("   4. Tilt hands LEFT / RIGHT to steer | Close fist to BRAKE")
    print("=" * 60)
    print("🚦 Focus your Game Window NOW to begin driving!\n")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            raw_angle = data.get("angle", 0.0)          
            is_braking = data.get("brake", False)   
            
            angle = raw_angle - CENTER_OFFSET

            # 1. BRAKE & ACCELERATE
            if is_braking:
                set_action('gas', False)
                set_action('brake', True)
            else:
                set_action('brake', False)
                if AUTO_ACCELERATE:
                    set_action('gas', True)
                else:
                    set_action('gas', False)

            # 2. STEERING (Left / Right / Center)
            if angle < -STEERING_THRESHOLD:
                # Tilt Left
                set_action('right', False)
                set_action('left', True)
            elif angle > STEERING_THRESHOLD:
                # Tilt Right
                set_action('left', False)
                set_action('right', True)
            else:
                # Center Deadzone
                set_action('left', False)
                set_action('right', False)

            # 3. CONSOLE TELEMETRY MONITOR
            gas_icon = "🟢 GAS " if action_states['gas'] else "       "
            brake_icon = "🔴 BRAKE" if action_states['brake'] else "        "
            
            if action_states['left']:
                steer_icon = "◀◀ LEFT    "
            elif action_states['right']:
                steer_icon = "    RIGHT ▶▶"
            else:
                steer_icon = " ── CENTER ──"
            
            bar_size = 20
            center = bar_size // 2
            pos = max(0, min(bar_size, round(center + angle * 10)))
            bar = list(" " * (bar_size + 1))
            bar[center] = "|"
            bar[pos] = "●"
            bar_str = "[" + "".join(bar) + "]"

            sys.stdout.write(f"\r{bar_str} Angle:{angle:+.2f} | {steer_icon} | {gas_icon} | {brake_icon}   ")
            sys.stdout.flush()

    except websockets.exceptions.ConnectionClosedOK:
        print("\n\n[DISCONNECTED] Camera HUD has been closed gracefully.")
    except websockets.exceptions.ConnectionClosedError:
        print("\n\n[DISCONNECTED] Camera HUD connection lost.")
    except Exception as e:
        print(f"\n\n[ERROR] Unexpected error: {e}")
    finally:
        release_all()
        print("[SAFETY] All keyboard inputs released.\n")

# =====================================================================
# 🚀 MAIN RUNNER
# =====================================================================
async def main():
    print("=" * 60)
    print("  🏎️  CYBERWHEEL HUB — UNIVERSAL GAME BRIDGE")
    print("  Converts hand gestures → WASD & ARROW KEYS simultaneously")
    print("=" * 60)
    print(f"  Steering Deadzone : {STEERING_DEADZONE}")
    print(f"  Steering Threshold: {STEERING_THRESHOLD}")
    print(f"  Auto Accelerate   : {AUTO_ACCELERATE}")
    print(f"  Keys Emulated     : WASD + Arrows + Space")
    print("=" * 60)
    print("🚀 WebSocket server listening on ws://localhost:8000 ...")
    print("   Open http://localhost:3000 in your browser and click START ENGINE.\n")
    
    async with websockets.serve(handle_telemetry, "0.0.0.0", 8000):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        release_all()
        print("\n\n[SHUTDOWN] Server stopped. All keys released.")
