/**
 * Coriolis Effect in a Rotating Space Habitat Simulator
 * Distracted Fortune Interactive Animation
 */

(function () {
  'use strict';

  // --- Physics State ---
  const state = {
    radius: 500,          // meters (radius of station)
    rpm: 1.338,           // revolutions per minute
    mass: 70,             // kg (jumper / projectile mass)
    force: 1500,          // Newtons (jump force)
    impulseTime: 0.14,    // seconds (push duration -> v_rel = (force/mass)*impulseTime)
    vRel: 3.0,            // m/s (launch speed relative to floor)
    launchAngleDeg: 0,    // degrees from local vertical (0 = straight to hub, + = spinward, - = antispinward)
    
    // Derived & Simulation variables
    omega: 0,             // rad/s
    gravityG: 1.0,        // g's at rim (1.0 = 9.807 m/s^2)
    vRim: 0,              // m/s (tangential velocity of rim)
    
    // Projectile Flight
    simTime: 0,           // current time in seconds along flight
    flightDuration: 0,    // total flight time until impact (seconds)
    apexHeight: 0,        // max height above floor (meters)
    landingOffsetM: 0,     // arc distance along floor relative to launch pad (meters, + = spinward)
    landingOffsetDeg: 0,   // angular offset (degrees)
    
    // Animation control
    isPlaying: true,
    isLaunched: false,
    speedMultiplier: 1.0,
    viewMode: 'both',     // 'both', 'inertial', 'rotating'
    
    // Station visual rotation angle in inertial frame
    stationAngle: 0,      // radians
  };

  // Preset Configurations
  const PRESETS = {
    '1km-earth': {
      name: '1 km Diameter Habitat (1.0g)',
      radius: 500,
      gravityG: 1.0,
      mass: 70,
      vRel: 3.0,
      launchAngleDeg: 0
    },
    'small-centrifuge': {
      name: 'Small 20m Ring (Strong Coriolis)',
      radius: 10,
      gravityG: 1.0,
      mass: 70,
      vRel: 3.0,
      launchAngleDeg: 0
    },
    'stanford-torus': {
      name: 'Stanford Torus (R = 895m, 1.0g)',
      radius: 895,
      gravityG: 1.0,
      mass: 70,
      vRel: 3.5,
      launchAngleDeg: 0
    },
    'moon-centrifuge': {
      name: 'Lunar Gravity Ring (0.166g, R = 200m)',
      radius: 200,
      gravityG: 0.166,
      mass: 70,
      vRel: 4.5,
      launchAngleDeg: 0
    },
    'spinward-throw': {
      name: 'Spinward Throw (+45°)',
      radius: 250,
      gravityG: 1.0,
      mass: 1,
      vRel: 15.0,
      launchAngleDeg: 45
    },
    'antispinward-throw': {
      name: 'Antispinward Throw (-45°)',
      radius: 250,
      gravityG: 1.0,
      mass: 1,
      vRel: 15.0,
      launchAngleDeg: -45
    }
  };

  // DOM Elements
  let elements = {};

  // Setup Canvases & Contexts
  let canvasInertial, ctxInertial;
  let canvasRotating, ctxRotating;
  let lastTimestamp = 0;

  function init() {
    cacheElements();
    attachEventListeners();
    updatePhysics(true);
    resetSimulation();
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    requestAnimationFrame(animationLoop);
  }

  function cacheElements() {
    elements = {
      // Sliders & Inputs
      sliderRadius: document.getElementById('slider-radius'),
      valRadius: document.getElementById('val-radius'),
      sliderRpm: document.getElementById('slider-rpm'),
      valRpm: document.getElementById('val-rpm'),
      sliderGravity: document.getElementById('slider-gravity'),
      valGravity: document.getElementById('val-gravity'),
      sliderMass: document.getElementById('slider-mass'),
      valMass: document.getElementById('val-mass'),
      sliderForce: document.getElementById('slider-force'),
      valForce: document.getElementById('val-force'),
      sliderVelocity: document.getElementById('slider-velocity'),
      valVelocity: document.getElementById('val-velocity'),
      sliderAngle: document.getElementById('slider-angle'),
      valAngle: document.getElementById('val-angle'),
      sliderSpeed: document.getElementById('slider-speed'),
      valSpeed: document.getElementById('val-speed'),

      // Buttons
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnStep: document.getElementById('btn-step'),
      btnReset: document.getElementById('btn-reset'),
      btnLaunch: document.getElementById('btn-launch'),
      
      // View Toggles
      btnViewBoth: document.getElementById('btn-view-both'),
      btnViewInertial: document.getElementById('btn-view-inertial'),
      btnViewRotating: document.getElementById('btn-view-rotating'),
      canvasesWrapper: document.getElementById('canvases-wrapper'),

      // Preset Buttons Container
      presetsContainer: document.getElementById('coriolis-presets'),

      // Telemetry Displays
      statGravity: document.getElementById('stat-gravity'),
      statRimSpeed: document.getElementById('stat-rim-speed'),
      statFlightTime: document.getElementById('stat-flight-time'),
      statApex: document.getElementById('stat-apex'),
      statLandingOffset: document.getElementById('stat-landing-offset'),
      statLandingDir: document.getElementById('stat-landing-dir'),
      statInertialSpeed: document.getElementById('stat-inertial-speed'),
    };

    canvasInertial = document.getElementById('canvas-inertial');
    ctxInertial = canvasInertial.getContext('2d');

    canvasRotating = document.getElementById('canvas-rotating');
    ctxRotating = canvasRotating.getContext('2d');
  }

  function attachEventListeners() {
    // Radius
    elements.sliderRadius.addEventListener('input', (e) => {
      state.radius = parseFloat(e.target.value);
      // Keep Gravity fixed or update RPM
      state.omega = Math.sqrt((state.gravityG * 9.80665) / state.radius);
      state.rpm = (state.omega * 60) / (2 * Math.PI);
      updatePhysics();
    });

    // RPM
    elements.sliderRpm.addEventListener('input', (e) => {
      state.rpm = parseFloat(e.target.value);
      state.omega = (state.rpm * 2 * Math.PI) / 60;
      state.gravityG = (state.omega * state.omega * state.radius) / 9.80665;
      updatePhysics();
    });

    // Gravity (g)
    elements.sliderGravity.addEventListener('input', (e) => {
      state.gravityG = parseFloat(e.target.value);
      state.omega = Math.sqrt((state.gravityG * 9.80665) / state.radius);
      state.rpm = (state.omega * 60) / (2 * Math.PI);
      updatePhysics();
    });

    // Mass
    elements.sliderMass.addEventListener('input', (e) => {
      state.mass = parseFloat(e.target.value);
      // Update vRel from force
      state.vRel = (state.force * state.impulseTime) / state.mass;
      updatePhysics();
    });

    // Force
    elements.sliderForce.addEventListener('input', (e) => {
      state.force = parseFloat(e.target.value);
      state.vRel = (state.force * state.impulseTime) / state.mass;
      updatePhysics();
    });

    // Direct Relative Velocity
    elements.sliderVelocity.addEventListener('input', (e) => {
      state.vRel = parseFloat(e.target.value);
      state.force = (state.mass * state.vRel) / state.impulseTime;
      updatePhysics();
    });

    // Angle
    elements.sliderAngle.addEventListener('input', (e) => {
      state.launchAngleDeg = parseFloat(e.target.value);
      updatePhysics();
    });

    // Sim Speed Multiplier
    elements.sliderSpeed.addEventListener('input', (e) => {
      state.speedMultiplier = parseFloat(e.target.value);
      elements.valSpeed.textContent = state.speedMultiplier.toFixed(2) + 'x';
    });

    // Play/Pause
    elements.btnPlayPause.addEventListener('click', togglePlayPause);

    // Step
    elements.btnStep.addEventListener('click', () => {
      state.isPlaying = false;
      elements.btnPlayPause.textContent = '▶ Play';
      stepSimulation(0.05);
    });

    // Reset
    elements.btnReset.addEventListener('click', () => {
      resetSimulation();
    });

    // Launch
    elements.btnLaunch.addEventListener('click', () => {
      resetSimulation();
      state.isLaunched = true;
      state.isPlaying = true;
      elements.btnPlayPause.textContent = '⏸ Pause';
    });

    // View Toggles
    elements.btnViewBoth.addEventListener('click', () => setViewMode('both'));
    elements.btnViewInertial.addEventListener('click', () => setViewMode('inertial'));
    elements.btnViewRotating.addEventListener('click', () => setViewMode('rotating'));

    // Presets
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key = btn.getAttribute('data-preset');
        if (PRESETS[key]) {
          applyPreset(PRESETS[key]);
        }
      });
    });
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    elements.btnViewBoth.classList.toggle('active', mode === 'both');
    elements.btnViewInertial.classList.toggle('active', mode === 'inertial');
    elements.btnViewRotating.classList.toggle('active', mode === 'rotating');

    elements.canvasesWrapper.classList.remove('single-inertial', 'single-rotating');
    if (mode === 'inertial') {
      elements.canvasesWrapper.classList.add('single-inertial');
    } else if (mode === 'rotating') {
      elements.canvasesWrapper.classList.add('single-rotating');
    }
    resizeCanvases();
  }

  function applyPreset(preset) {
    state.radius = preset.radius;
    state.gravityG = preset.gravityG;
    state.mass = preset.mass;
    state.vRel = preset.vRel;
    state.launchAngleDeg = preset.launchAngleDeg;

    state.omega = Math.sqrt((state.gravityG * 9.80665) / state.radius);
    state.rpm = (state.omega * 60) / (2 * Math.PI);
    state.force = (state.mass * state.vRel) / state.impulseTime;

    updatePhysics(true);
    resetSimulation();
  }

  function togglePlayPause() {
    state.isPlaying = !state.isPlaying;
    elements.btnPlayPause.textContent = state.isPlaying ? '⏸ Pause' : '▶ Play';
  }

  function updatePhysics(syncSliders = false) {
    state.omega = (state.rpm * 2 * Math.PI) / 60;
    state.vRim = state.omega * state.radius;

    // Angle in radians (0 is straight up towards center, positive is spinward, negative is antispinward)
    const angleRad = (state.launchAngleDeg * Math.PI) / 180;

    // Launch coordinates in inertial frame (Launch from bottom at (0, -R))
    // Rim velocity at bottom (0, -R) is in +X direction (counter-clockwise spin)
    const vRimX = state.vRim;
    const vRimY = 0;

    // Relative velocity components
    // +Y is toward the hub (upward from bottom rim)
    // +X is in the direction of rotation (spinward)
    const vRelX = state.vRel * Math.sin(angleRad);
    const vRelY = state.vRel * Math.cos(angleRad);

    // Total Inertial Velocity Vector at launch
    const v0x = vRimX + vRelX;
    const v0y = vRimY + vRelY;
    const v0Total = Math.sqrt(v0x * v0x + v0y * v0y);

    // Analytic landing calculation:
    // r(t) = (v0x * t, -R + v0y * t)
    // |r(t)|^2 = R^2 => (v0x^2 + v0y^2)*t^2 - 2*R*v0y*t = 0
    if (v0y > 0.0001 && v0Total > 0.0001) {
      state.flightDuration = (2 * state.radius * v0y) / (v0Total * v0Total);
      
      // Apex calculations (at half flight time):
      const tApex = state.flightDuration / 2;
      const xApex = v0x * tApex;
      const yApex = -state.radius + v0y * tApex;
      const rMin = Math.sqrt(xApex * xApex + yApex * yApex);
      state.apexHeight = Math.max(0, state.radius - rMin);

      // Impact coordinates in Inertial Frame:
      const xImpact = v0x * state.flightDuration;
      const yImpact = -state.radius + v0y * state.flightDuration;
      const phiImpactInertial = Math.atan2(yImpact, xImpact); // radians from positive X axis

      // Angular position of the launch spot on the floor at impact time:
      // Launch spot started at -PI/2 (bottom) and rotated counterclockwise by omega * t
      const phiFloorAtImpact = -Math.PI / 2 + state.omega * state.flightDuration;

      // Angular difference (projectile landing spot minus launch pad spot):
      let deltaPhi = phiImpactInertial - phiFloorAtImpact;
      // Normalize to [-PI, PI]
      deltaPhi = ((deltaPhi + Math.PI) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI) - Math.PI;

      state.landingOffsetDeg = (deltaPhi * 180) / Math.PI;
      state.landingOffsetM = state.radius * deltaPhi;
    } else {
      state.flightDuration = 0;
      state.apexHeight = 0;
      state.landingOffsetM = 0;
      state.landingOffsetDeg = 0;
    }

    // Update UI Elements
    elements.valRadius.textContent = `${Math.round(state.radius)} m`;
    elements.valRpm.textContent = `${state.rpm.toFixed(2)} RPM`;
    elements.valGravity.textContent = `${state.gravityG.toFixed(2)} g (${(state.gravityG * 9.807).toFixed(1)} m/s²)`;
    elements.valMass.textContent = `${Math.round(state.mass)} kg (${Math.round(state.mass * 2.20462)} lbs)`;
    elements.valForce.textContent = `${Math.round(state.force)} N`;
    elements.valVelocity.textContent = `${state.vRel.toFixed(1)} m/s (${(state.vRel * 3.6).toFixed(1)} km/h)`;
    elements.valAngle.textContent = `${state.launchAngleDeg > 0 ? '+' : ''}${state.launchAngleDeg}° ${state.launchAngleDeg > 0 ? '(Spinward)' : state.launchAngleDeg < 0 ? '(Antispinward)' : '(Straight Up)'}`;

    if (syncSliders) {
      elements.sliderRadius.value = state.radius;
      elements.sliderRpm.value = state.rpm;
      elements.sliderGravity.value = state.gravityG;
      elements.sliderMass.value = state.mass;
      elements.sliderForce.value = state.force;
      elements.sliderVelocity.value = state.vRel;
      elements.sliderAngle.value = state.launchAngleDeg;
    } else {
      elements.sliderRadius.value = state.radius;
      elements.sliderRpm.value = state.rpm;
      elements.sliderGravity.value = state.gravityG;
      elements.sliderMass.value = state.mass;
      elements.sliderForce.value = state.force;
      elements.sliderVelocity.value = state.vRel;
    }

    // Update Telemetry Panel
    elements.statGravity.textContent = `${state.gravityG.toFixed(2)} g`;
    elements.statRimSpeed.textContent = `${state.vRim.toFixed(1)} m/s (${(state.vRim * 3.6).toFixed(0)} km/h)`;
    elements.statFlightTime.textContent = `${state.flightDuration.toFixed(2)} s`;
    elements.statApex.textContent = `${state.apexHeight.toFixed(2)} m (${((state.apexHeight / state.radius) * 100).toFixed(1)}% R)`;
    elements.statInertialSpeed.textContent = `${v0Total.toFixed(1)} m/s`;

    const absOffset = Math.abs(state.landingOffsetM);
    const offsetStr = absOffset < 100 ? `${absOffset.toFixed(2)} m` : `${Math.round(absOffset)} m`;
    elements.statLandingOffset.textContent = offsetStr;

    if (Math.abs(state.landingOffsetM) < 0.01) {
      elements.statLandingDir.textContent = 'Exact Launch Pad';
      elements.statLandingOffset.className = 'stat-val';
    } else if (state.landingOffsetM > 0) {
      elements.statLandingDir.textContent = `Spinward (Forward +${state.landingOffsetDeg.toFixed(1)}°)`;
      elements.statLandingOffset.className = 'stat-val highlight-spinward';
    } else {
      elements.statLandingDir.textContent = `Antispinward (Backward ${state.landingOffsetDeg.toFixed(1)}°)`;
      elements.statLandingOffset.className = 'stat-val highlight-antispinward';
    }
  }

  function resetSimulation() {
    state.simTime = 0;
    state.stationAngle = 0;
    state.isLaunched = true; // Auto-arm so playback shows flight
  }

  function stepSimulation(dt) {
    if (state.flightDuration <= 0) return;
    state.simTime += dt;
    state.stationAngle += state.omega * dt;

    if (state.simTime >= state.flightDuration) {
      state.simTime = state.flightDuration;
      state.isPlaying = false;
      elements.btnPlayPause.textContent = '▶ Play';
    }
  }

  function resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;
    [canvasInertial, canvasRotating].forEach(canvas => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
    });
  }

  // --- Animation Frame Loop ---
  function animationLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (state.isPlaying) {
      const simDt = deltaSeconds * state.speedMultiplier;
      state.stationAngle += state.omega * simDt;

      if (state.isLaunched && state.flightDuration > 0) {
        state.simTime += simDt;
        if (state.simTime >= state.flightDuration) {
          // Loop animation smoothly after pause
          if (state.simTime >= state.flightDuration + 1.2) {
            state.simTime = 0;
          }
        }
      }
    }

    renderInertialFrame();
    renderRotatingFrame();

    requestAnimationFrame(animationLoop);
  }

  // --- Calculation Helpers for Trajectories ---
  function getInertialCoordsAtTime(t) {
    const angleRad = (state.launchAngleDeg * Math.PI) / 180;
    const v0x = state.vRim + state.vRel * Math.sin(angleRad);
    const v0y = state.vRel * Math.cos(angleRad);

    const x = v0x * t;
    const y = -state.radius + v0y * t;
    return { x, y };
  }

  function getRotatingCoordsAtTime(t) {
    const inertial = getInertialCoordsAtTime(t);
    const r = Math.sqrt(inertial.x * inertial.x + inertial.y * inertial.y);
    const phiInertial = Math.atan2(inertial.y, inertial.x);

    // In rotating frame anchored to the launch pad (which starts at bottom -PI/2):
    // The launch pad angle in inertial frame at time t is (-PI/2 + omega * t)
    // Relative angle:
    const phiRot = phiInertial - state.omega * t;

    // Convert relative polar back to Cartesian (with launch pad at bottom 6 o'clock: -PI/2)
    const xRot = r * Math.cos(phiRot);
    const yRot = r * Math.sin(phiRot);
    return { x: xRot, y: yRot, r, phiRot };
  }

  // --- Render Inertial Frame View ---
  function renderInertialFrame() {
    if (state.viewMode === 'rotating') return;
    const ctx = ctxInertial;
    const width = canvasInertial.width;
    const height = canvasInertial.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = (Math.min(width, height) * 0.42) / state.radius;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Draw Space Station Outer Ring & Floor
    ctx.beginPath();
    ctx.arc(0, 0, state.radius * scale, 0, 2 * Math.PI);
    ctx.lineWidth = 6 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Habitat Interior Living Floor (Glow Ring)
    ctx.beginPath();
    ctx.arc(0, 0, (state.radius - 2) * scale, 0, 2 * Math.PI);
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();

    // Draw Spokes (Rotating with the station)
    const numSpokes = 8;
    ctx.lineWidth = 1 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    for (let i = 0; i < numSpokes; i++) {
      const spokeAngle = state.stationAngle + (i * 2 * Math.PI) / numSpokes;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(spokeAngle) * state.radius * scale, Math.sin(spokeAngle) * state.radius * scale);
      ctx.stroke();
    }

    // Central Hub
    ctx.beginPath();
    ctx.arc(0, 0, 8 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
    ctx.fillStyle = '#64748b';
    ctx.fill();

    // Spin Direction Indicator Arrow
    drawRotationIndicator(ctx, state.radius * scale * 1.08, state.omega > 0);

    // Draw Floor Launch Marker (Rotating with station)
    // Launched from -PI/2 + state.stationAngle
    const launchPadAngle = -Math.PI / 2 + state.stationAngle;
    const padX = Math.cos(launchPadAngle) * state.radius * scale;
    const padY = Math.sin(launchPadAngle) * state.radius * scale;

    ctx.beginPath();
    ctx.arc(padX, padY, 5 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
    ctx.fillStyle = '#34d399';
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#34d399';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // If Launched: Draw Complete Inertial Trajectory (Straight Chord)
    if (state.flightDuration > 0) {
      const pStart = getInertialCoordsAtTime(0);
      const pEnd = getInertialCoordsAtTime(state.flightDuration);

      ctx.beginPath();
      ctx.moveTo(pStart.x * scale, pStart.y * scale);
      ctx.lineTo(pEnd.x * scale, pEnd.y * scale);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
      ctx.setLineDash([4 * (window.devicePixelRatio || 1), 4 * (window.devicePixelRatio || 1)]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Landing Marker on outer ring
      ctx.beginPath();
      ctx.arc(pEnd.x * scale, pEnd.y * scale, 6 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
      ctx.fillStyle = state.landingOffsetM >= 0 ? '#34d399' : '#f43f5e';
      ctx.fill();

      // Current Projectile Position
      const currT = Math.min(state.simTime, state.flightDuration);
      const currentPos = getInertialCoordsAtTime(currT);

      // Trajectory covered so far (solid cyan)
      ctx.beginPath();
      ctx.moveTo(pStart.x * scale, pStart.y * scale);
      ctx.lineTo(currentPos.x * scale, currentPos.y * scale);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3 * (window.devicePixelRatio || 1);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Projectile Dot
      ctx.beginPath();
      ctx.arc(currentPos.x * scale, currentPos.y * scale, 7 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Canvas Overlay Info
    drawCanvasBadge(ctx, 'Station Inertial View', 'True Straight-Line Flight', '#38bdf8');
  }

  // --- Render Rotating Frame View (Habitat Perspective) ---
  function renderRotatingFrame() {
    if (state.viewMode === 'inertial') return;
    const ctx = ctxRotating;
    const width = canvasRotating.width;
    const height = canvasRotating.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = (Math.min(width, height) * 0.42) / state.radius;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Draw Fixed Habitat Circle (Anchored to Floor Observer)
    ctx.beginPath();
    ctx.arc(0, 0, state.radius * scale, 0, 2 * Math.PI);
    ctx.lineWidth = 6 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Habitat Living Surface Glow
    ctx.beginPath();
    ctx.arc(0, 0, (state.radius - 2) * scale, 0, 2 * Math.PI);
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.stroke();

    // Fixed Radial Grid / Sectors
    const numGrid = 12;
    ctx.lineWidth = 1 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
    for (let i = 0; i < numGrid; i++) {
      const angle = (i * 2 * Math.PI) / numGrid;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * state.radius * scale, Math.sin(angle) * state.radius * scale);
      ctx.stroke();
    }

    // Central Hub
    ctx.beginPath();
    ctx.arc(0, 0, 8 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
    ctx.fillStyle = '#64748b';
    ctx.fill();

    // Launch Pad fixed at bottom (0, R) in Canvas coords => (0, state.radius * scale)
    const padPadY = state.radius * scale;
    ctx.beginPath();
    ctx.arc(0, padPadY, 6 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
    ctx.fillStyle = '#34d399';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#34d399';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Apparent Floor Rotation Direction Indicator (to the right = Spinward)
    drawFloorDirectionLabels(ctx, state.radius * scale);

    // Draw Full Curved Rotating Coriolis Trajectory
    if (state.flightDuration > 0) {
      const steps = 120;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * state.flightDuration;
        const pt = getRotatingCoordsAtTime(t);
        if (i === 0) ctx.moveTo(pt.x * scale, pt.y * scale);
        else ctx.lineTo(pt.x * scale, pt.y * scale);
      }
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
      ctx.setLineDash([4 * (window.devicePixelRatio || 1), 4 * (window.devicePixelRatio || 1)]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Landing Point Marker on the Floor
      const ptEnd = getRotatingCoordsAtTime(state.flightDuration);
      ctx.beginPath();
      ctx.arc(ptEnd.x * scale, ptEnd.y * scale, 6 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
      ctx.fillStyle = state.landingOffsetM >= 0 ? '#34d399' : '#f43f5e';
      ctx.fill();

      // Trajectory covered so far (Solid Amber/Gold Curve)
      const currT = Math.min(state.simTime, state.flightDuration);
      const currSteps = Math.max(2, Math.floor((currT / state.flightDuration) * steps));
      ctx.beginPath();
      for (let i = 0; i <= currSteps; i++) {
        const t = (i / currSteps) * currT;
        const pt = getRotatingCoordsAtTime(t);
        if (i === 0) ctx.moveTo(pt.x * scale, pt.y * scale);
        else ctx.lineTo(pt.x * scale, pt.y * scale);
      }
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3 * (window.devicePixelRatio || 1);
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Projectile Dot in Rotating Frame
      const ptCurr = getRotatingCoordsAtTime(currT);
      ctx.beginPath();
      ctx.arc(ptCurr.x * scale, ptCurr.y * scale, 7 * (window.devicePixelRatio || 1), 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Arc Displacement Indicator along the floor
      drawLandingArc(ctx, state.radius * scale, ptEnd);
    }

    ctx.restore();

    // Canvas Overlay Info
    drawCanvasBadge(ctx, 'Rotating Habitat View', 'Apparent Curved Coriolis Path', '#fbbf24');
  }

  function drawRotationIndicator(ctx, r, isCCW) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, -0.6 * Math.PI, -0.2 * Math.PI, !isCCW);
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.stroke();

    // Arrowhead
    const arrowAngle = -0.2 * Math.PI;
    const ax = Math.cos(arrowAngle) * r;
    const ay = Math.sin(arrowAngle) * r;
    ctx.beginPath();
    ctx.moveTo(ax + 5, ay - 8);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax - 8, ay - 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.font = `${10 * (window.devicePixelRatio || 1)}px sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Spin Direction (CCW)', Math.cos(-0.4 * Math.PI) * (r + 15), Math.sin(-0.4 * Math.PI) * (r + 15));
    ctx.restore();
  }

  function drawFloorDirectionLabels(ctx, r) {
    ctx.save();
    ctx.font = `${10 * (window.devicePixelRatio || 1)}px monospace`;
    ctx.fillStyle = '#94a3b8';

    // Spinward (+X, right side of bottom)
    ctx.fillText('Spinward ➔', 25 * (window.devicePixelRatio || 1), r + 20 * (window.devicePixelRatio || 1));
    // Antispinward (-X, left side of bottom)
    ctx.fillText('⬸ Antispinward', -115 * (window.devicePixelRatio || 1), r + 20 * (window.devicePixelRatio || 1));

    ctx.restore();
  }

  function drawLandingArc(ctx, r, ptEnd) {
    ctx.save();
    const padAngle = Math.PI / 2; // Bottom in standard canvas coords
    const endAngle = Math.atan2(ptEnd.y, ptEnd.x);

    ctx.beginPath();
    ctx.arc(0, 0, r + 6 * (window.devicePixelRatio || 1), padAngle, endAngle, state.landingOffsetM < 0);
    ctx.lineWidth = 3 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = state.landingOffsetM >= 0 ? '#34d399' : '#f43f5e';
    ctx.stroke();
    ctx.restore();
  }

  function drawCanvasBadge(ctx, title, subtitle, accentColor) {
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.font = `bold ${12 * dpr}px sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(title, 14 * dpr, 24 * dpr);

    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.fillText(subtitle, 14 * dpr, 40 * dpr);
    ctx.restore();
  }

  // Initialize once DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
