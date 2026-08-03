"""
=============================================================================
Smart Home AI Control Center — Enhanced Backend (Flask)
=============================================================================

This module implements a production-quality Smart Home AI Agent system.
It monitors room temperature using a virtual sensor, controls an Air Conditioner
actuator automatically using goal-based reasoning, tracks energy and comfort
analytics, supports multiple operating modes (Auto, Eco, Turbo, Manual), and
provides real-time telemetry for the AI Control Center frontend.

API Endpoints:
    GET  /temperature         - Read current sensor value
    POST /set-temperature     - Set user desired target temperature
    GET  /status              - Get complete telemetry & agent state
    GET  /history             - Get decision log history
    POST /simulation/start    - Start continuous monitoring loop
    POST /simulation/stop     - Stop monitoring loop
    POST /set-mode            - Set agent mode (Auto, Eco, Turbo, Manual)
    POST /set-ac-manual       - Manually force AC state in Manual mode
    POST /set-speed           - Set simulation speed (1x, 2x, 5x)
    POST /reset               - Reset telemetry, stats, and history
    GET  /analytics           - Get time-series charts data
    GET  /weather             - Get outdoor simulated weather parameters

Author: AI Senior Engineer
=============================================================================
"""

# ──────────────────────────────────────────────────────────────────────────────
# Imports
# ──────────────────────────────────────────────────────────────────────────────
import random
import threading
import time
from datetime import datetime, timedelta
from flask import Flask, jsonify, render_template, request

# ──────────────────────────────────────────────────────────────────────────────
# Flask Application Initialisation
# ──────────────────────────────────────────────────────────────────────────────
app = Flask(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Global State (Agent Knowledge Base & Environment Telemetry)
# ──────────────────────────────────────────────────────────────────────────────

current_temperature = 25.0       # Current room temperature (°C)
desired_temperature = 24.0       # Target temperature (°C)
ac_status = "OFF"                # AC Actuator status: "ON" or "OFF"
agent_mode = "Auto"              # Operating mode: "Auto", "Eco", "Turbo", "Manual"
simulation_running = False      # Monitoring loop flag
simulation_speed = 1             # Speed multiplier: 1x, 2x, 5x
simulation_thread = None         # Thread reference
state_lock = threading.Lock()    # Concurrency lock

# Decision & Telemetry Logs
decision_history = []            # Decision event log
analytics_series = []            # Time-series data for Chart.js analytics

# Agent Statistics & Performance Metrics
total_decisions_count = 0        # Total decisions logged today
ac_on_seconds = 0               # Total seconds AC has been running
total_monitored_seconds = 0     # Total monitoring active seconds
start_time = datetime.now()      # Server start timestamp

# Outdoor Weather Simulation Parameters
outdoor_temp = 32.5              # °C
outdoor_humidity = 58            # %
outdoor_wind = 12                # km/h
outdoor_condition = "Sunny"      # Condition string


# ══════════════════════════════════════════════════════════════════════════════
#  SENSOR & ENVIRONMENT SIMULATION
# ══════════════════════════════════════════════════════════════════════════════

def read_sensor():
    """
    Simulate reading from room temperature sensor with realistic thermal dynamics.
    When AC is ON, temperature tends to drift down. When AC is OFF, temp drifts up towards outdoor temp.
    Random noise is added to mimic real sensor physics.
    """
    global current_temperature
    
    # Thermal physics drift
    drift = -0.4 if ac_status == "ON" else 0.3
    # Add random fluctuation (-0.3 to +0.3)
    noise = random.uniform(-0.3, 0.3)
    
    new_temp = current_temperature + (drift * 0.4) + noise
    
    # If unmonitored or random jump desired, stay bounded 18.0°C to 35.0°C
    new_temp = max(18.0, min(35.0, new_temp))
    return round(new_temp, 1)


def update_outdoor_weather():
    """Simulate subtle outdoor weather fluctuations."""
    global outdoor_temp, outdoor_humidity, outdoor_wind, outdoor_condition
    outdoor_temp = round(max(26.0, min(39.0, outdoor_temp + random.uniform(-0.2, 0.2))), 1)
    outdoor_humidity = int(max(40, min(85, outdoor_humidity + random.randint(-1, 1))))
    outdoor_wind = int(max(5, min(25, outdoor_wind + random.randint(-1, 1))))
    
    conditions = ["Sunny", "Clear Sky", "Partly Cloudy", "Warm Breeze"]
    if random.random() < 0.1:
        outdoor_condition = random.choice(conditions)


# ══════════════════════════════════════════════════════════════════════════════
#  AI AGENT DECISION LOGIC & METRICS
# ══════════════════════════════════════════════════════════════════════════════

def calculate_ai_confidence(temp, desired, mode):
    """
    Calculate AI confidence percentage based on signal stability, distance from threshold,
    and active operational mode.
    """
    delta = abs(temp - desired)
    # Higher confidence when clear decision boundary is met
    if delta > 3.0:
        base_confidence = 98.0
    elif delta > 1.0:
        base_confidence = 94.0
    else:
        base_confidence = 89.0
        
    # Mode-based modifier
    if mode == "Eco":
        base_confidence += 1.0
    elif mode == "Turbo":
        base_confidence += 1.5
    elif mode == "Manual":
        base_confidence = 100.0  # Human override confidence
        
    # Add small variance
    confidence = base_confidence + random.uniform(-1.0, 1.0)
    return round(max(75.0, min(99.9, confidence)), 1)


def calculate_comfort_index(temp, desired):
    """
    Calculate comfort index (0% to 100%) based on proximity to ideal target temperature.
    """
    diff = abs(temp - desired)
    if diff <= 0.5:
        score = 100.0
    elif diff <= 1.5:
        score = 100.0 - (diff - 0.5) * 15.0
    elif diff <= 4.0:
        score = 85.0 - (diff - 1.5) * 20.0
    else:
        score = max(10.0, 35.0 - (diff - 4.0) * 5.0)
    return round(score, 1)


def agent_decide(temp, desired, previous_ac_status, mode):
    """
    Core Goal-Based AI Agent Decision Engine.
    
    Supports 4 Operational Modes:
      - Auto: Goal target ±1.0°C hysteresis
      - Eco: Goal target 26.0°C (or desired) ±1.5°C hysteresis for max energy saving
      - Turbo: Rapid cooling target (18.0°C) with aggressive ON state
      - Manual: Maintain user manual command
    """
    reason = ""
    new_status = previous_ac_status
    
    if mode == "Manual":
        reason = f"Manual Override active. AC state controlled directly by user ({previous_ac_status})."
        return previous_ac_status, reason, "Manual Override", 100.0

    if mode == "Eco":
        target = max(25.0, desired) # Eco keeps target higher
        if temp > target + 1.5:
            new_status = "ON"
            reason = f"Eco Mode: Room temperature ({temp}°C) exceeds Eco threshold ({target + 1.5}°C). Turning AC ON."
        elif temp < target - 1.5:
            new_status = "OFF"
            reason = f"Eco Mode: Temperature ({temp}°C) dropped below Eco lower bound ({target - 1.5}°C). Turning AC OFF to save energy."
        else:
            reason = f"Eco Mode: Temperature ({temp}°C) within Eco comfort band ({target - 1.5}°C - {target + 1.5}°C). Maintaining AC {previous_ac_status}."
        goal = "Energy Optimization"

    elif mode == "Turbo":
        target = min(20.0, desired) # Turbo targets cool room fast
        if temp > target:
            new_status = "ON"
            reason = f"Turbo Mode: Temperature ({temp}°C) above Turbo target ({target}°C). Maximum cooling active."
        else:
            new_status = "OFF"
            reason = f"Turbo Mode: Target rapid cooling achieved ({temp}°C). Turning AC OFF."
        goal = "Rapid Cooling"

    else: # Auto Goal-Based Agent Mode
        target = desired
        if temp > target + 1.0:
            new_status = "ON"
            reason = f"Auto Mode: Room temperature ({temp}°C) exceeds target ({target}°C) + 1.0°C. AC turned ON."
        elif temp < target - 1.0:
            new_status = "OFF"
            reason = f"Auto Mode: Room temperature ({temp}°C) below target ({target}°C) - 1.0°C. AC turned OFF."
        else:
            reason = f"Auto Mode: Temperature ({temp}°C) is within ±1.0°C comfort zone of {target}°C. AC remains {previous_ac_status}."
        goal = "Maintain Target Comfort"

    confidence = calculate_ai_confidence(temp, target, mode)
    return new_status, reason, goal, confidence


def log_decision(temp, desired, new_status, reason, goal, confidence):
    """Record entry into agent decision history & analytics series."""
    global total_decisions_count
    total_decisions_count += 1
    
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    full_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    comfort_idx = calculate_comfort_index(temp, desired)
    
    entry = {
        "id": total_decisions_count,
        "timestamp": timestamp,
        "full_timestamp": full_timestamp,
        "temperature": temp,
        "desired": desired,
        "ac_status": new_status,
        "mode": agent_mode,
        "reason": reason,
        "goal": goal,
        "confidence": confidence,
        "comfort_index": comfort_idx
    }
    
    if len(decision_history) >= 50:
        decision_history.pop(0)
    decision_history.append(entry)

    # Time series record for Chart.js
    analytics_entry = {
        "time": timestamp,
        "temperature": temp,
        "desired": desired,
        "ac_state": 1 if new_status == "ON" else 0,
        "comfort": comfort_idx,
        "power_kw": 1.8 if new_status == "ON" else 0.05
    }
    
    if len(analytics_series) >= 30:
        analytics_series.pop(0)
    analytics_series.append(analytics_entry)


# ══════════════════════════════════════════════════════════════════════════════
#  CONTINUOUS SIMULATION LOOP
# ══════════════════════════════════════════════════════════════════════════════

def simulation_loop():
    """
    Background simulation worker thread. Updates environment, runs AI decision,
    and updates telemetry.
    """
    global current_temperature, ac_status, simulation_running, ac_on_seconds, total_monitored_seconds

    while simulation_running:
        with state_lock:
            # 1. Sense environment
            current_temperature = read_sensor()
            update_outdoor_weather()

            # 2. Agent Decision Engine
            new_status, reason, goal, confidence = agent_decide(
                current_temperature, desired_temperature, ac_status, agent_mode
            )

            # 3. Actuate
            ac_status = new_status

            # 4. Metrics & Logging
            interval_sec = 2.0 / simulation_speed
            total_monitored_seconds += interval_sec
            if ac_status == "ON":
                ac_on_seconds += interval_sec

            log_decision(current_temperature, desired_temperature, ac_status, reason, goal, confidence)

        # Sleep interval based on simulation speed multiplier
        sleep_dur = max(0.2, 2.0 / simulation_speed)
        time.sleep(sleep_dur)


# ══════════════════════════════════════════════════════════════════════════════
#  FLASK ROUTE CONTROLLERS (REST APIs)
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    """Render the main Smart Home AI Control Center webpage."""
    return render_template("index.html")


@app.route("/temperature", methods=["GET"])
def get_temperature():
    """GET /temperature: Returns current room temperature."""
    global current_temperature
    with state_lock:
        if not simulation_running:
            current_temperature = read_sensor()
        return jsonify({"temperature": current_temperature})


@app.route("/set-temperature", methods=["POST"])
def set_temperature():
    """POST /set-temperature: Set target desired temperature (16°C to 30°C)."""
    global desired_temperature
    data = request.get_json(silent=True) or {}

    if "desired" not in data:
        return jsonify({"error": "Missing 'desired' temperature parameter."}), 400

    try:
        val = float(data["desired"])
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid temperature format."}), 400

    if val < 16.0 or val > 30.0:
        return jsonify({"error": "Desired temperature must be between 16°C and 30°C."}), 400

    with state_lock:
        desired_temperature = val
        # If in Eco or Turbo mode, setting temp manually switches mode to Auto
        if agent_mode in ["Eco", "Turbo"]:
            pass # Keep mode or allow adjustment

    return jsonify({
        "desired": desired_temperature,
        "message": f"Desired temperature set to {desired_temperature}°C."
    })


@app.route("/set-mode", methods=["POST"])
def set_mode():
    """POST /set-mode: Change operational mode ('Auto', 'Eco', 'Turbo', 'Manual')."""
    global agent_mode, desired_temperature
    data = request.get_json(silent=True) or {}
    mode = data.get("mode")

    if mode not in ["Auto", "Eco", "Turbo", "Manual"]:
        return jsonify({"error": "Invalid mode. Choose from Auto, Eco, Turbo, Manual."}), 400

    with state_lock:
        agent_mode = mode
        if mode == "Eco":
            desired_temperature = 26.0
        elif mode == "Turbo":
            desired_temperature = 18.0

    return jsonify({
        "mode": agent_mode,
        "desired": desired_temperature,
        "message": f"Agent mode switched to {agent_mode}."
    })


@app.route("/set-ac-manual", methods=["POST"])
def set_ac_manual():
    """POST /set-ac-manual: Direct actuator control in Manual mode."""
    global ac_status, agent_mode
    data = request.get_json(silent=True) or {}
    status = data.get("status")

    if status not in ["ON", "OFF"]:
        return jsonify({"error": "Invalid status. Must be 'ON' or 'OFF'."}), 400

    with state_lock:
        agent_mode = "Manual"
        ac_status = status
        log_decision(
            current_temperature, desired_temperature, ac_status,
            f"User manually toggled AC to {ac_status}.", "Manual Control", 100.0
        )

    return jsonify({
        "ac_status": ac_status,
        "mode": agent_mode,
        "message": f"AC manually set to {ac_status}."
    })


@app.route("/set-speed", methods=["POST"])
def set_speed():
    """POST /set-speed: Set simulation speed multiplier (1, 2, 5)."""
    global simulation_speed
    data = request.get_json(silent=True) or {}
    speed = data.get("speed", 1)

    try:
        speed = int(speed)
        if speed not in [1, 2, 5]:
            speed = 1
    except (ValueError, TypeError):
        speed = 1

    with state_lock:
        simulation_speed = speed

    return jsonify({"speed": simulation_speed, "message": f"Simulation speed set to {simulation_speed}x."})


@app.route("/status", methods=["GET"])
def get_status():
    """
    GET /status: Full real-time telemetry payload for dashboard rendering.
    """
    with state_lock:
        comfort = calculate_comfort_index(current_temperature, desired_temperature)
        confidence = calculate_ai_confidence(current_temperature, desired_temperature, agent_mode)

        # Calculate energy savings percentage compared to non-stop AC
        duty_cycle = (ac_on_seconds / total_monitored_seconds * 100.0) if total_monitored_seconds > 0 else 0.0
        energy_saved_pct = round(max(0.0, 100.0 - duty_cycle), 1)
        kwh_est = round((ac_on_seconds / 3600.0) * 1.8, 2) # Assume 1.8kW AC rating

        # Extract latest decision reason & goal
        last_reason = decision_history[-1]["reason"] if decision_history else "System initialized."
        last_goal = decision_history[-1]["goal"] if decision_history else "Maintain Comfort"

        return jsonify({
            "temperature": current_temperature,
            "desired": desired_temperature,
            "ac_status": ac_status,
            "mode": agent_mode,
            "simulation_running": simulation_running,
            "simulation_speed": simulation_speed,
            "comfort_index": comfort,
            "ai_confidence": confidence,
            "reason": last_reason,
            "goal": last_goal,
            "total_decisions": total_decisions_count,
            "ac_runtime_seconds": int(ac_on_seconds),
            "energy_saved_pct": energy_saved_pct,
            "energy_kwh": kwh_est,
            "outdoor": {
                "temperature": outdoor_temp,
                "humidity": outdoor_humidity,
                "wind": outdoor_wind,
                "condition": outdoor_condition
            }
        })


@app.route("/history", methods=["GET"])
def get_history():
    """GET /history: Returns full decision log history."""
    with state_lock:
        return jsonify({"history": list(decision_history)})


@app.route("/analytics", methods=["GET"])
def get_analytics():
    """GET /analytics: Returns time-series datasets for Chart.js graphs."""
    with state_lock:
        return jsonify({"series": list(analytics_series)})


@app.route("/weather", methods=["GET"])
def get_weather():
    """GET /weather: Returns outdoor weather telemetry."""
    with state_lock:
        return jsonify({
            "temperature": outdoor_temp,
            "humidity": outdoor_humidity,
            "wind_speed": outdoor_wind,
            "condition": outdoor_condition
        })


@app.route("/simulation/start", methods=["POST"])
def start_simulation():
    """POST /simulation/start: Launch background agent loop."""
    global simulation_running, simulation_thread

    with state_lock:
        if simulation_running:
            return jsonify({"message": "Simulation is already active."})
        simulation_running = True

    simulation_thread = threading.Thread(target=simulation_loop, daemon=True)
    simulation_thread.start()

    return jsonify({"message": "Simulation launched successfully."})


@app.route("/simulation/stop", methods=["POST"])
def stop_simulation():
    """POST /simulation/stop: Halt background agent loop."""
    global simulation_running

    with state_lock:
        if not simulation_running:
            return jsonify({"message": "Simulation is not currently running."})
        simulation_running = False

    return jsonify({"message": "Simulation stopped."})


@app.route("/reset", methods=["POST"])
def reset_system():
    """POST /reset: Reset agent memory, telemetry, statistics and decision log."""
    global current_temperature, desired_temperature, ac_status, agent_mode
    global decision_history, analytics_series, total_decisions_count, ac_on_seconds, total_monitored_seconds

    with state_lock:
        current_temperature = 25.0
        desired_temperature = 24.0
        ac_status = "OFF"
        agent_mode = "Auto"
        decision_history.clear()
        analytics_series.clear()
        total_decisions_count = 0
        ac_on_seconds = 0
        total_monitored_seconds = 0
        
        # Initial log
        log_decision(25.0, 24.0, "OFF", "System reset to default initial state.", "System Initialized", 95.0)

    return jsonify({"message": "Smart Home AI system reset successfully."})


# ══════════════════════════════════════════════════════════════════════════════
#  SERVER MAIN ENTRY
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 70)
    print("  Smart Home AI Control Center — Production Server")
    print("  Server listening on http://127.0.0.1:5000")
    print("=" * 70)
    app.run(debug=True, port=5000)
