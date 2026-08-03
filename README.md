# 🏠 Smart Home AI Simulator & Control Center

> A futuristic, production-quality Smart Home AI Dashboard featuring real-time telemetry, goal-based AI reasoning, interactive living room visualizer with particle airflow, Chart.js live charts, vertical activity timeline, multi-mode operation, and JARVIS AI voice assistant.

---

## 🌟 Key Features

- 🤖 **Goal-Based AI Agent Engine**: Operates with ±1.0°C hysteresis band to prevent rapid AC cycling.
- ⚡ **Multi-Mode Support**:
  - **Auto Mode**: Goal-based 24.0°C target comfort control.
  - **Eco Mode**: 26.0°C target with wide ±1.5°C band for maximum energy savings.
  - **Turbo Mode**: 18.0°C target for rapid room cooling.
  - **Manual Mode**: Direct human actuator override.
- 💨 **Wall-Mounted AC & Canvas Airflow**: Animated fan blades and dynamic cold blue airflow particles when AC is ON.
- 🎨 **Futuristic Glassmorphism Theme**: Dark navy aesthetics with electric blue/cyan ambient glows and dynamic temperature theme transitions (`theme-cold`, `theme-comfort`, `theme-hot`).
- 📈 **Live Chart.js Analytics**: Dynamic temperature history streams and AC power load timeline (kW).
- 📜 **Vertical Activity Timeline**: Chronological log of all agent decisions with status badges and reasoning text.
- 🎙️ **JARVIS Floating Voice Assistant**: Interactive avatar with Web Speech API speech synthesis.
- ⚡ **Simulation Speed Control**: 1x Normal, 2x Fast, and 5x Turbo simulation speeds.

---

## 🗂️ Folder Structure

```
GenAi/
├── app.py                 # Enhanced Flask backend (11 REST APIs, multi-mode logic, telemetry)
├── requirements.txt       # Python dependencies (Flask)
├── README.md              # Project guide & API docs
├── static/
│   ├── style.css          # Futuristic dark navy glassmorphism stylesheet
│   └── script.js          # Canvas particle airflow engine, Chart.js graphs, JARVIS voice assistant
├── templates/
│   └── index.html         # Main dashboard HTML template
└── docs/
    └── report.md          # Comprehensive technical project report
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.8 or higher installed
- `pip` package manager

### Steps

1. **Navigate to the project directory**:
   ```bash
   cd "c:\Users\PRASAD MARUPILLI\OneDrive\Desktop\Documents\Desktop\GenAi"
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the Flask backend server**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   Visit **`http://127.0.0.1:5000`**

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the main Smart Home AI Control Center webpage |
| `GET` | `/status` | Returns complete real-time telemetry, AI confidence, comfort index, and metrics |
| `GET` | `/temperature` | Returns current room temperature reading |
| `POST` | `/set-temperature` | Sets target goal temperature (`{"desired": 24.0}`) |
| `POST` | `/set-mode` | Sets agent mode (`{"mode": "Auto" \| "Eco" \| "Turbo" \| "Manual"}`) |
| `POST` | `/set-ac-manual` | Direct manual AC override (`{"status": "ON" \| "OFF"}`) |
| `POST` | `/set-speed` | Sets simulation speed multiplier (`{"speed": 1 \| 2 \| 5}`) |
| `POST` | `/simulation/start` | Starts background monitoring loop |
| `POST` | `/simulation/stop` | Pauses background monitoring loop |
| `POST` | `/reset` | Resets telemetry, decision count, runtime, and history |
| `GET` | `/history` | Returns decision log history |
| `GET` | `/analytics` | Returns time-series dataset stream for Chart.js |
| `GET` | `/weather` | Returns simulated outdoor weather parameters |

---

## 🧠 Agent Reasoning Logic

```
IF mode == "Auto":
    IF current_temp > desired_temp + 1.0°C  -> AC = ON (Cooling required)
    ELIF current_temp < desired_temp - 1.0°C -> AC = OFF (Comfort achieved)
    ELSE                                     -> Keep previous AC state (Hysteresis)

ELIF mode == "Eco":
    Target = 26.0°C, Hysteresis = ±1.5°C (Saves energy)

ELIF mode == "Turbo":
    Target = 18.0°C (Rapid cooling)
```

---

## 📄 License

Created for educational and demonstration purposes.
