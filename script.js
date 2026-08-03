/**
 * =============================================================================
 * Smart Home AI Simulator — Interactive JS Engine
 * =============================================================================
 * Author: Senior Full-Stack & AI Developer
 *
 * Features:
 *   1. Canvas Particle Engine (Ambient background + AC airflow stream)
 *   2. Chart.js Live Analytics Graphs
 *   3. Real-Time Telemetry & Gauge Renderer
 *   4. Living Room SVG & Wall AC Actuator Animations
 *   5. Smart Mode Control Handlers (Auto, Eco, Turbo, Manual)
 *   6. Vertical Activity Timeline Engine
 *   7. JARVIS Floating Voice Assistant & Speech Synthesis
 * =============================================================================
 */

// ═══════════════════════════════════════════════════════════════════════════
//  DOM ELEMENTS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// Header HUD Elements
const navTime           = document.getElementById("navTime");
const navDate           = document.getElementById("navDate");
const navOutsideTemp    = document.getElementById("navOutsideTemp");
const navWeatherCond    = document.getElementById("navWeatherCond");
const navWeatherIcon    = document.getElementById("navWeatherIcon");
const voiceToggleBtn    = document.getElementById("voiceToggleBtn");
const voiceIcon         = document.getElementById("voiceIcon");
const systemStatusText  = document.getElementById("systemStatusText");

// Hero Section Elements
const heroCurrentTemp   = document.getElementById("heroCurrentTemp");
const heroTargetTemp    = document.getElementById("heroTargetTemp");
const comfortBadge      = document.getElementById("comfortBadge");
const gaugeArc          = document.getElementById("gaugeArc");
const thermoIcon        = document.getElementById("thermoIcon");
const aiConfVal         = document.getElementById("aiConfVal");

// Room & AC Visualizer Elements
const acStateBadge      = document.getElementById("acStateBadge");
const acFanBlade        = document.getElementById("acFanBlade");
const acLedIndicator    = document.getElementById("acLedIndicator");
const acDisplayTemp     = document.getElementById("acDisplayTemp");
const ledLightStrip     = document.getElementById("ledLightStrip");
const floorLamp         = document.getElementById("floorLamp");

// AI Agent HUD Elements
const agentModeTag      = document.getElementById("agentModeTag");
const agentGoalText     = document.getElementById("agentGoalText");
const hudReasoningText  = document.getElementById("hudReasoningText");
const hudDecisionText   = document.getElementById("hudDecisionText");
const hudDecisionPill   = document.getElementById("hudDecisionPill");
const confBarFill       = document.getElementById("confBarFill");
const confNum           = document.getElementById("confNum");

// Stats Cards Elements
const statCurrentTemp   = document.getElementById("statCurrentTemp");
const statDesiredTemp   = document.getElementById("statDesiredTemp");
const statComfortIdx    = document.getElementById("statComfortIdx");
const statTotalDecisions= document.getElementById("statTotalDecisions");
const statAcRuntime     = document.getElementById("statAcRuntime");
const statEnergySaved   = document.getElementById("statEnergySaved");
const statKwh           = document.getElementById("statKwh");

// Smart Controls Elements
const tempRangeSlider   = document.getElementById("tempRangeSlider");
const sliderValDisplay  = document.getElementById("sliderValDisplay");
const sliderMinusBtn    = document.getElementById("sliderMinusBtn");
const sliderPlusBtn     = document.getElementById("sliderPlusBtn");
const applyTempBtn      = document.getElementById("applyTempBtn");
const startSimBtn       = document.getElementById("startSimBtn");
const stopSimBtn        = document.getElementById("stopSimBtn");
const speedBtn          = document.getElementById("speedBtn");
const speedMenu         = document.getElementById("speedMenu");
const speedIndicator    = document.getElementById("speedIndicator");
const resetBtn          = document.getElementById("resetBtn");
const modeBtns          = document.querySelectorAll(".mode-btn");
const manualToggleBlock = document.getElementById("manualToggleBlock");
const manualAcOnBtn     = document.getElementById("manualAcOnBtn");
const manualAcOffBtn    = document.getElementById("manualAcOffBtn");

// Weather Elements
const weatherOutTemp    = document.getElementById("weatherOutTemp");
const weatherCondition  = document.getElementById("weatherCondition");
const weatherHumidity   = document.getElementById("weatherHumidity");
const weatherWind       = document.getElementById("weatherWind");

// Timeline Elements
const verticalTimeline  = document.getElementById("verticalTimeline");
const emptyTimelineState= document.getElementById("emptyTimelineState");
const timelineCountTag  = document.getElementById("timelineCountTag");

// Voice Assistant Elements
const floatingAssistant = document.getElementById("floatingAssistant");
const aiSpeechBubble    = document.getElementById("aiSpeechBubble");
const aiSpeechText      = document.getElementById("aiSpeechText");
const aiAvatarTrigger   = document.getElementById("aiAvatarTrigger");

// Global Application State
let pollTimer = null;
let isSimulationActive = false;
let isVoiceEnabled = true;
let currentAcState = "OFF";
let currentAgentMode = "Auto";
let lastDecisionId = -1;

// Gauge Math Constant (arc perimeter)
const GAUGE_MAX_ARC = 424;


// ═══════════════════════════════════════════════════════════════════════════
//  1. CANVAS PARTICLE ENGINE (Ambient Background + AC Airflow)
// ═══════════════════════════════════════════════════════════════════════════

const ambientCanvas = document.getElementById("ambientCanvas");
const ambientCtx = ambientCanvas.getContext("2d");
let ambientParticles = [];

function initAmbientCanvas() {
    ambientCanvas.width = window.innerWidth;
    ambientCanvas.height = window.innerHeight;
    ambientParticles = [];
    for (let i = 0; i < 45; i++) {
        ambientParticles.push({
            x: Math.random() * ambientCanvas.width,
            y: Math.random() * ambientCanvas.height,
            radius: Math.random() * 2.5 + 1,
            vx: Math.random() * 0.4 - 0.2,
            vy: Math.random() * -0.5 - 0.2,
            alpha: Math.random() * 0.5 + 0.2
        });
    }
}

function animateAmbientCanvas() {
    ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
    ambientParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) p.y = ambientCanvas.height;
        if (p.x < 0) p.x = ambientCanvas.width;
        if (p.x > ambientCanvas.width) p.x = 0;

        ambientCtx.beginPath();
        ambientCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ambientCtx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ambientCtx.fill();
    });
    requestAnimationFrame(animateAmbientCanvas);
}

// AC Airflow Stream Canvas
const airflowCanvas = document.getElementById("airflowCanvas");
const airflowCtx = airflowCanvas.getContext("2d");
let airflowParticles = [];

function initAirflowCanvas() {
    airflowCanvas.width = 300;
    airflowCanvas.height = 180;
    airflowParticles = [];
}

function updateAirflowParticles() {
    airflowCtx.clearRect(0, 0, airflowCanvas.width, airflowCanvas.height);
    if (currentAcState === "ON") {
        if (airflowParticles.length < 35) {
            airflowParticles.push({
                x: 100 + Math.random() * 60,
                y: 0,
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 3 + 1.5,
                alpha: 0.8
            });
        }
        airflowParticles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.015;

            airflowCtx.beginPath();
            airflowCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            airflowCtx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
            airflowCtx.shadowBlur = 8;
            airflowCtx.shadowColor = "#22d3ee";
            airflowCtx.fill();

            if (p.alpha <= 0 || p.y > airflowCanvas.height) {
                airflowParticles.splice(idx, 1);
            }
        });
    } else {
        airflowParticles = [];
    }
    requestAnimationFrame(updateAirflowParticles);
}


// ═══════════════════════════════════════════════════════════════════════════
//  2. LIVE CHART.JS ANALYTICS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

let tempChartInstance = null;
let powerChartInstance = null;

function initCharts() {
    // Chart 1: Temperature Telemetry Line Chart
    const tempCtx = document.getElementById("tempChart").getContext("2d");
    tempChartInstance = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Room Temperature (°C)',
                    data: [],
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#22d3ee'
                },
                {
                    label: 'Target Goal (°C)',
                    data: [],
                    borderColor: '#6366f1',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            scales: {
                x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { min: 16, max: 36, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
            }
        }
    });

    // Chart 2: AC Power Output Bar/Line Chart
    const powerCtx = document.getElementById("powerChart").getContext("2d");
    powerChartInstance = new Chart(powerCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'AC Power (kW)',
                    data: [],
                    backgroundColor: 'rgba(56, 189, 248, 0.5)',
                    borderColor: '#38bdf8',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            scales: {
                x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { min: 0, max: 2.5, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
            }
        }
    });
}

function updateCharts(series) {
    if (!series || series.length === 0) return;

    const labels = series.map(s => s.time);
    const temps = series.map(s => s.temperature);
    const desireds = series.map(s => s.desired);
    const powers = series.map(s => s.power_kw);

    tempChartInstance.data.labels = labels;
    tempChartInstance.data.datasets[0].data = temps;
    tempChartInstance.data.datasets[1].data = desireds;
    tempChartInstance.update('none');

    powerChartInstance.data.labels = labels;
    powerChartInstance.data.datasets[0].data = powers;
    powerChartInstance.update('none');
}


// ═══════════════════════════════════════════════════════════════════════════
//  3. TELEMETRY UPDATER & UI GAUGE RENDERER
// ═══════════════════════════════════════════════════════════════════════════

function renderGauge(temp, desired) {
    heroCurrentTemp.textContent = temp.toFixed(1);
    heroTargetTemp.textContent = desired.toFixed(1);
    acDisplayTemp.textContent = `${Math.round(desired)}°`;

    // Calculate arc fraction (18°C to 35°C range)
    const minT = 18;
    const maxT = 35;
    const clamped = Math.max(minT, Math.min(maxT, temp));
    const fraction = (clamped - minT) / (maxT - minT);
    const arcLength = fraction * GAUGE_MAX_ARC;

    gaugeArc.setAttribute("stroke-dasharray", `${arcLength} 565`);

    // Ambient body theme update
    document.body.classList.remove("theme-cold", "theme-comfort", "theme-hot");
    if (temp < 20.0) {
        document.body.classList.add("theme-cold");
        comfortBadge.textContent = "Cool / Chilly";
        comfortBadge.style.color = "#38bdf8";
        thermoIcon.className = "fa-solid fa-temperature-empty";
    } else if (temp <= 26.0) {
        document.body.classList.add("theme-comfort");
        comfortBadge.textContent = "Optimal Comfort";
        comfortBadge.style.color = "#34d399";
        thermoIcon.className = "fa-solid fa-temperature-half";
    } else {
        document.body.classList.add("theme-hot");
        comfortBadge.textContent = "Warm / Elevated";
        comfortBadge.style.color = "#ef4444";
        thermoIcon.className = "fa-solid fa-temperature-full";
    }
}

function renderACState(status) {
    currentAcState = status;
    if (status === "ON") {
        acStateBadge.classList.add("active");
        acStateBadge.innerHTML = `<i class="fa-solid fa-snowflake"></i> AC COOLING ON`;
        acFanBlade.classList.add("spinning");
        acLedIndicator.classList.add("on");
    } else {
        acStateBadge.classList.remove("active");
        acStateBadge.innerHTML = `<i class="fa-solid fa-power-off"></i> AC OFF`;
        acFanBlade.classList.remove("spinning");
        acLedIndicator.classList.remove("on");
    }
}

function renderHUD(data) {
    agentModeTag.textContent = `${data.mode.toUpperCase()} MODE`;
    agentGoalText.textContent = data.goal || "Maintain Comfort";
    hudReasoningText.textContent = data.reason || "System monitoring active.";

    hudDecisionText.textContent = data.ac_status === "ON" ? "COOLING (ON)" : "STANDBY (OFF)";
    hudDecisionPill.className = `decision-pill ${data.ac_status.toLowerCase()}`;

    confBarFill.style.width = `${data.ai_confidence}%`;
    confNum.textContent = `${data.ai_confidence}%`;
    aiConfVal.textContent = `${data.ai_confidence}%`;
}

function renderStats(data) {
    statCurrentTemp.textContent = `${data.temperature.toFixed(1)}°C`;
    statDesiredTemp.textContent = `${data.desired.toFixed(1)}°C`;
    statComfortIdx.textContent = `${data.comfort_index}%`;
    statTotalDecisions.textContent = data.total_decisions;
    statAcRuntime.textContent = `${data.ac_runtime_seconds}s`;
    statEnergySaved.textContent = `${data.energy_saved_pct}%`;
    statKwh.textContent = `${data.energy_kwh} kWh est.`;

    if (data.outdoor) {
        weatherOutTemp.textContent = `${data.outdoor.temperature}°C`;
        navOutsideTemp.textContent = `${data.outdoor.temperature}°C`;
        weatherCondition.textContent = data.outdoor.condition;
        navWeatherCond.textContent = data.outdoor.condition;
        weatherHumidity.textContent = `${data.outdoor.humidity}%`;
        weatherWind.textContent = `${data.outdoor.wind} km/h`;
    }
}


// ═══════════════════════════════════════════════════════════════════════════
//  4. VERTICAL ACTIVITY TIMELINE RENDERER
// ═══════════════════════════════════════════════════════════════════════════

function renderTimeline(history) {
    if (!history || history.length === 0) {
        emptyTimelineState.classList.remove("hidden");
        verticalTimeline.innerHTML = "";
        timelineCountTag.textContent = "0 Events";
        return;
    }

    emptyTimelineState.classList.add("hidden");
    timelineCountTag.textContent = `${history.length} Event${history.length > 1 ? 's' : ''}`;

    const items = [...history].reverse();
    verticalTimeline.innerHTML = "";

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "timeline-item";

        const isOn = item.ac_status === "ON";
        const markerClass = isOn ? "on" : "off";
        const icon = isOn ? "fa-snowflake" : "fa-power-off";

        div.innerHTML = `
            <div class="timeline-marker ${markerClass}">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="timeline-header">
                <span class="timeline-time">${item.timestamp}</span>
                <div class="timeline-badges">
                    <span class="tl-temp-badge">${item.temperature.toFixed(1)}°C</span>
                    <span class="tl-ac-badge ${item.ac_status.toLowerCase()}">${item.ac_status}</span>
                </div>
            </div>
            <p class="timeline-reason">${item.reason}</p>
        `;
        verticalTimeline.appendChild(div);
    });
}


// ═══════════════════════════════════════════════════════════════════════════
//  5. JARVIS FLOATING VOICE ASSISTANT & SPEECH SYNTHESIS
// ═══════════════════════════════════════════════════════════════════════════

function speakMessage(text) {
    aiSpeechText.textContent = text;
    aiSpeechBubble.style.animation = 'none';
    void aiSpeechBubble.offsetHeight; // trigger reflow
    aiSpeechBubble.style.animation = 'popBubble 0.4s var(--ease-out)';

    if (isVoiceEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}


// ═══════════════════════════════════════════════════════════════════════════
//  6. API COMMUNICATIONS
// ═══════════════════════════════════════════════════════════════════════════

async function fetchStatus() {
    try {
        const res = await fetch("/status");
        const data = await res.json();

        renderGauge(data.temperature, data.desired);
        renderACState(data.ac_status);
        renderHUD(data);
        renderStats(data);

        isSimulationActive = data.simulation_running;
        currentAgentMode = data.mode;

        // Sync inputs
        if (parseFloat(tempRangeSlider.value) !== data.desired) {
            tempRangeSlider.value = data.desired;
            sliderValDisplay.textContent = `${data.desired.toFixed(1)}°C`;
        }

        // Active mode button sync
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === data.mode) btn.classList.add("active");
            else btn.classList.remove("active");
        });

        // Show/hide manual control block
        if (data.mode === "Manual") manualToggleBlock.classList.remove("hidden");
        else manualToggleBlock.classList.add("hidden");

        // Simulation start/stop buttons sync
        startSimBtn.disabled = data.simulation_running;
        stopSimBtn.disabled = !data.simulation_running;
        systemStatusText.textContent = data.simulation_running ? "SIMULATION RUNNING" : "SYSTEM IDLE";

        speedIndicator.textContent = `${data.simulation_speed}x Speed`;
        speedBtn.innerHTML = `<i class="fa-solid fa-gauge"></i> ${data.simulation_speed}x Speed`;

    } catch (err) {
        console.error("Fetch status error:", err);
    }
}

async function fetchHistoryAndAnalytics() {
    try {
        const [resHist, resAna] = await Promise.all([
            fetch("/history"),
            fetch("/analytics")
        ]);

        const dataHist = await resHist.json();
        const dataAna = await resAna.json();

        renderTimeline(dataHist.history);
        updateCharts(dataAna.series);

        // Check if new decision arrived to trigger AI Voice alert
        if (dataHist.history && dataHist.history.length > 0) {
            const latest = dataHist.history[dataHist.history.length - 1];
            if (latest.id !== lastDecisionId) {
                lastDecisionId = latest.id;
                if (latest.ac_status === "ON") {
                    speakMessage(`Alert: AC cooling activated. Room temperature is ${latest.temperature.toFixed(1)}°C.`);
                } else if (latest.ac_status === "OFF") {
                    speakMessage(`AC turned OFF. Target temperature achieved.`);
                }
            }
        }
    } catch (err) {
        console.error("Fetch history/analytics error:", err);
    }
}

async function setDesiredTemp(value) {
    try {
        const res = await fetch("/set-temperature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ desired: value })
        });
        const data = await res.json();
        if (res.ok) {
            speakMessage(`Target temperature updated to ${value}°C.`);
            fetchStatus();
        }
    } catch (err) {
        console.error("Set temperature error:", err);
    }
}

async function setAgentMode(mode) {
    try {
        const res = await fetch("/set-mode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: mode })
        });
        const data = await res.json();
        if (res.ok) {
            speakMessage(`Agent switched to ${mode} mode.`);
            fetchStatus();
        }
    } catch (err) {
        console.error("Set mode error:", err);
    }
}

async function setManualAc(status) {
    try {
        const res = await fetch("/set-ac-manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status })
        });
        if (res.ok) {
            speakMessage(`Manual AC override set to ${status}.`);
            fetchStatus();
        }
    } catch (err) {
        console.error("Manual AC set error:", err);
    }
}

async function startSimulation() {
    try {
        const res = await fetch("/simulation/start", { method: "POST" });
        if (res.ok) {
            speakMessage("Simulation launched. Continuous thermal monitoring active.");
            fetchStatus();
            startPolling();
        }
    } catch (err) {
        console.error("Start sim error:", err);
    }
}

async function stopSimulation() {
    try {
        const res = await fetch("/simulation/stop", { method: "POST" });
        if (res.ok) {
            speakMessage("Simulation paused.");
            fetchStatus();
        }
    } catch (err) {
        console.error("Stop sim error:", err);
    }
}

async function setSimSpeed(speed) {
    try {
        const res = await fetch("/set-speed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ speed: speed })
        });
        if (res.ok) {
            speakMessage(`Simulation speed set to ${speed}x.`);
            fetchStatus();
        }
    } catch (err) {
        console.error("Set speed error:", err);
    }
}

async function resetSystem() {
    try {
        const res = await fetch("/reset", { method: "POST" });
        if (res.ok) {
            speakMessage("System telemetry and agent memory reset to defaults.");
            lastDecisionId = -1;
            fetchStatus();
            fetchHistoryAndAnalytics();
        }
    } catch (err) {
        console.error("Reset error:", err);
    }
}


// ═══════════════════════════════════════════════════════════════════════════
//  7. EVENT LISTENERS & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
        fetchStatus();
        fetchHistoryAndAnalytics();
    }, 2000);
}

function updateClock() {
    const now = new Date();
    navTime.textContent = now.toLocaleTimeString();
    navDate.textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Event Listeners setup
tempRangeSlider.addEventListener("input", (e) => {
    sliderValDisplay.textContent = `${parseFloat(e.target.value).toFixed(1)}°C`;
});

applyTempBtn.addEventListener("click", () => {
    setDesiredTemp(parseFloat(tempRangeSlider.value));
});

sliderMinusBtn.addEventListener("click", () => {
    const val = Math.max(16, parseFloat(tempRangeSlider.value) - 0.5);
    tempRangeSlider.value = val;
    sliderValDisplay.textContent = `${val.toFixed(1)}°C`;
    setDesiredTemp(val);
});

sliderPlusBtn.addEventListener("click", () => {
    const val = Math.min(30, parseFloat(tempRangeSlider.value) + 0.5);
    tempRangeSlider.value = val;
    sliderValDisplay.textContent = `${val.toFixed(1)}°C`;
    setDesiredTemp(val);
});

modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        setAgentMode(btn.dataset.mode);
    });
});

manualAcOnBtn.addEventListener("click", () => setManualAc("ON"));
manualAcOffBtn.addEventListener("click", () => setManualAc("OFF"));

startSimBtn.addEventListener("click", startSimulation);
stopSimBtn.addEventListener("click", stopSimulation);
resetBtn.addEventListener("click", resetSystem);

speedBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    speedMenu.classList.toggle("show");
});

document.addEventListener("click", () => speedMenu.classList.remove("show"));

speedMenu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
        setSimSpeed(parseInt(btn.dataset.speed));
    });
});

voiceToggleBtn.addEventListener("click", () => {
    isVoiceEnabled = !isVoiceEnabled;
    voiceIcon.className = isVoiceEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    speakMessage(isVoiceEnabled ? "Voice assistant enabled." : "Voice assistant muted.");
});

aiAvatarTrigger.addEventListener("click", () => {
    speakMessage("I am JARVIS, your Smart Home Goal-Based AI Agent. Monitoring climate balance.");
});

window.addEventListener("resize", initAmbientCanvas);

// Init Execution
window.addEventListener("DOMContentLoaded", () => {
    initAmbientCanvas();
    animateAmbientCanvas();
    initAirflowCanvas();
    updateAirflowParticles();
    initCharts();
    updateClock();
    setInterval(updateClock, 1000);

    fetchStatus();
    fetchHistoryAndAnalytics();
    startPolling();
});
