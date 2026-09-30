/**
 * 2D Car Dodging Game
 * Built with HTML5 Canvas & Vanilla JavaScript
 */

(function () {
  'use strict';

  // --- Canvas & Rendering Setup ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 650;

  // Setup Hi-DPI scaling for sharp rendering
  function setupHiDPI() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  setupHiDPI();
  window.addEventListener('resize', setupHiDPI);

  // --- Constants & Configurations ---
  const ROAD_LEFT = 45;
  const ROAD_RIGHT = 355;
  const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
  const NUM_LANES = 3;
  const LANE_WIDTH = ROAD_WIDTH / NUM_LANES;

  const CAR_WIDTH = 38;
  const CAR_HEIGHT = 68;

  const BASE_SPEED = 260; // Pixels per second
  const MAX_SPEED = 640;
  const SPEED_ACCEL_RATE = 10; // Speed increase per second
  const STEER_SPEED = 320; // Player horizontal movement speed

  const ENEMY_COLORS = [
    { body: '#ef4444', detail: '#fca5a5' }, // Crimson
    { body: '#f59e0b', detail: '#fde68a' }, // Amber
    { body: '#10b981', detail: '#a7f3d0' }, // Emerald
    { body: '#8b5cf6', detail: '#ddd6fe' }, // Violet
    { body: '#ec4899', detail: '#fbcfe8' }, // Pink
    { body: '#3b82f6', detail: '#bfdbfe' }, // Cobalt
  ];

  // --- Game States ---
  const STATE = {
    START: 'START',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER',
  };

  let currentState = STATE.START;

  // --- Game Variables ---
  let score = 0;
  let highScore = 0;
  let survivalTime = 0;
  let currentSpeed = BASE_SPEED;
  let roadScrollOffset = 0;

  let spawnTimer = 0;
  let enemies = [];

  const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 105,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    vx: 0,
    color: { body: '#06b6d4', detail: '#cffafe' }, // Vibrant cyan
  };

  // --- Input State ---
  const keys = {
    left: false,
    right: false,
  };

  window.addEventListener('keydown', (e) => {
    // Prevent default scrolling for game controls
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keys.right = true;
    }

    // State triggers: Enter or Space
    if (e.code === 'Space' || e.code === 'Enter') {
      if (currentState === STATE.START) {
        startGame();
      } else if (currentState === STATE.GAMEOVER) {
        restartGame();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keys.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keys.right = false;
    }
  });

  // --- State Transitions ---
  function startGame() {
    score = 0;
    survivalTime = 0;
    currentSpeed = BASE_SPEED;
    roadScrollOffset = 0;
    spawnTimer = 0;
    enemies = [];

    player.x = GAME_WIDTH / 2;
    player.vx = 0;

    currentState = STATE.PLAYING;
  }

  function restartGame() {
    startGame();
  }

  function triggerGameOver() {
    currentState = STATE.GAMEOVER;
    if (score > highScore) {
      highScore = score;
    }
  }

  // --- Spawning Logic ---
  function getLaneCenter(laneIndex) {
    return ROAD_LEFT + (laneIndex + 0.5) * LANE_WIDTH;
  }

  function spawnEnemy() {
    // Pick lane, preferably not blocked near spawn entry
    const laneCandidates = [0, 1, 2].sort(() => Math.random() - 0.5);
    let chosenLane = -1;

    for (let lane of laneCandidates) {
      const laneX = getLaneCenter(lane);
      // Ensure no enemy is currently near the top of this lane
      const isBlocked = enemies.some(
        (enemy) => Math.abs(enemy.x - laneX) < 15 && enemy.y < CAR_HEIGHT * 1.5
      );
      if (!isBlocked) {
        chosenLane = lane;
        break;
      }
    }

    if (chosenLane === -1) {
      return; // Delay spawn until a lane is open
    }

    const color = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
    // Relative speed: enemies move slightly slower than road speed so they travel downward
    const speedRatio = 0.58 + Math.random() * 0.18;
    const enemySpeed = currentSpeed * speedRatio;

    enemies.push({
      x: getLaneCenter(chosenLane),
      y: -CAR_HEIGHT,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
      vy: enemySpeed,
      color: color,
    });
  }

  // --- Collision Detection (AABB with tuned inset for fairness) ---
  function checkCollision(a, b) {
    const insetX = 4;
    const insetY = 5;

    const aLeft = a.x - a.width / 2 + insetX;
    const aRight = a.x + a.width / 2 - insetX;
    const aTop = a.y - a.height / 2 + insetY;
    const aBottom = a.y + a.height / 2 - insetY;

    const bLeft = b.x - b.width / 2 + insetX;
    const bRight = b.x + b.width / 2 - insetX;
    const bTop = b.y - b.height / 2 + insetY;
    const bBottom = b.y + b.height / 2 - insetY;

    return (
      aLeft < bRight &&
      aRight > bLeft &&
      aTop < bBottom &&
      aBottom > bTop
    );
  }

  // --- Update Loop ---
  function update(dt) {
    // Scroll road background
    roadScrollOffset = (roadScrollOffset + currentSpeed * dt) % 80;

    if (currentState === STATE.PLAYING) {
      // 1. Time & Difficulty Progression
      survivalTime += dt;
      currentSpeed = Math.min(MAX_SPEED, BASE_SPEED + survivalTime * SPEED_ACCEL_RATE);
      score = Math.floor(survivalTime * 15 + (currentSpeed - BASE_SPEED) * 0.2);

      // 2. Player Steering (smooth responsive movement)
      let targetVx = 0;
      if (keys.left) targetVx -= STEER_SPEED;
      if (keys.right) targetVx += STEER_SPEED;

      player.vx += (targetVx - player.vx) * 16 * dt;
      player.x += player.vx * dt;

      // Keep within road shoulders
      const halfW = player.width / 2;
      const minX = ROAD_LEFT + halfW + 3;
      const maxX = ROAD_RIGHT - halfW - 3;
      if (player.x < minX) {
        player.x = minX;
        player.vx = 0;
      } else if (player.x > maxX) {
        player.x = maxX;
        player.vx = 0;
      }

      // 3. Enemy Spawning
      spawnTimer += dt;
      // Faster spawn rate as game speed increases
      const spawnInterval = Math.max(0.65, 1.7 - (currentSpeed - BASE_SPEED) * 0.0022);
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnEnemy();
      }

      // 4. Update & Clean Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.vy * dt;

        // Collision Check
        if (checkCollision(player, enemy)) {
          triggerGameOver();
          return;
        }

        // Despawn off-screen
        if (enemy.y - enemy.height / 2 > GAME_HEIGHT + 30) {
          enemies.splice(i, 1);
        }
      }
    }
  }

  // --- Procedural Car Drawing ---
  function drawCar(x, y, width, height, colors, isPlayer = false, tilt = 0) {
    ctx.save();
    ctx.translate(x, y);

    if (tilt !== 0) {
      ctx.rotate(tilt);
    }

    const halfW = width / 2;
    const halfH = height / 2;

    // Headlight Beams (for player car)
    if (isPlayer) {
      ctx.save();
      const beamGrad = ctx.createLinearGradient(0, -halfH, 0, -halfH - 120);
      beamGrad.addColorStop(0, 'rgba(255, 255, 230, 0.35)');
      beamGrad.addColorStop(1, 'rgba(255, 255, 230, 0.0)');

      ctx.fillStyle = beamGrad;
      // Left Beam
      ctx.beginPath();
      ctx.moveTo(-halfW + 4, -halfH);
      ctx.lineTo(-halfW - 22, -halfH - 120);
      ctx.lineTo(-halfW + 18, -halfH - 120);
      ctx.closePath();
      ctx.fill();

      // Right Beam
      ctx.beginPath();
      ctx.moveTo(halfW - 4, -halfH);
      ctx.lineTo(halfW - 18, -halfH - 120);
      ctx.lineTo(halfW + 22, -halfH - 120);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Car Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.roundRect(-halfW - 2, -halfH + 4, width + 4, height, 10);
    ctx.fill();

    // 4 Wheels
    ctx.fillStyle = '#111827';
    const wheelW = 5;
    const wheelH = 13;
    const wheelInsetX = halfW + 1;
    const wheelOffsetY = halfH * 0.55;

    // Front Wheels
    ctx.fillRect(-wheelInsetX, -wheelOffsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(wheelInsetX - wheelW, -wheelOffsetY - wheelH / 2, wheelW, wheelH);
    // Rear Wheels
    ctx.fillRect(-wheelInsetX, wheelOffsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(wheelInsetX - wheelW, wheelOffsetY - wheelH / 2, wheelW, wheelH);

    // Main Car Body
    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, width, height, 10);
    ctx.fill();

    // Body Contour / Side Panels
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(-halfW + 4, -halfH + 8, 3, height - 16);
    ctx.fillRect(halfW - 7, -halfH + 8, 3, height - 16);

    // Front Windshield (Cockpit)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-halfW + 6, -halfH + 16, width - 12, 14, 3);
    ctx.fill();

    // Windshield Glass Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.moveTo(-halfW + 8, -halfH + 28);
    ctx.lineTo(-halfW + 14, -halfH + 18);
    ctx.lineTo(-halfW + 19, -halfH + 18);
    ctx.lineTo(-halfW + 13, -halfH + 28);
    ctx.closePath();
    ctx.fill();

    // Car Roof / Cabin
    ctx.fillStyle = colors.detail;
    ctx.beginPath();
    ctx.roundRect(-halfW + 7, -halfH + 32, width - 14, 15, 3);
    ctx.fill();

    // Rear Window
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-halfW + 7, -halfH + 49, width - 14, 7, 2);
    ctx.fill();

    // Headlights (Front)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfH + 2, 7, 4, 2);
    ctx.roundRect(halfW - 11, -halfH + 2, 7, 4, 2);
    ctx.fill();

    // Taillights (Rear)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, halfH - 4, 7, 3, 1);
    ctx.roundRect(halfW - 11, halfH - 4, 7, 3, 1);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Rear Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-halfW + 2, halfH - 2, width - 4, 3);

    ctx.restore();
  }

  // --- Road & Environment Drawing ---
  function drawRoad() {
    // 1. Roadside Grass/Shoulder Backdrop
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Main Asphalt Surface
    ctx.fillStyle = '#181e29';
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, GAME_HEIGHT);

    // 3. Scrolling Curbs (Rumble Strips) on Left and Right Shoulders
    const curbW = 10;
    const stripH = 40;
    const totalStrips = Math.ceil(GAME_HEIGHT / stripH) + 2;

    for (let i = -1; i < totalStrips; i++) {
      const stripY = i * stripH + (roadScrollOffset % stripH);
      const isRed = (i + Math.floor(roadScrollOffset / stripH)) % 2 === 0;
      ctx.fillStyle = isRed ? '#dc2626' : '#f8fafc';

      // Left Curb
      ctx.fillRect(ROAD_LEFT - curbW, stripY, curbW, stripH);
      // Right Curb
      ctx.fillRect(ROAD_RIGHT, stripY, curbW, stripH);
    }

    // 4. Solid White Boundary Lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(ROAD_LEFT, 0, 3, GAME_HEIGHT);
    ctx.fillRect(ROAD_RIGHT - 3, 0, 3, GAME_HEIGHT);

    // 5. Scrolling Dashed Lane Dividers
    const dashLength = 36;
    const dashGap = 34;
    const dashCycle = dashLength + dashGap;
    const totalDashes = Math.ceil(GAME_HEIGHT / dashCycle) + 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (let lane = 1; lane < NUM_LANES; lane++) {
      const lineX = ROAD_LEFT + lane * LANE_WIDTH - 2;

      for (let i = -1; i < totalDashes; i++) {
        const dashY = i * dashCycle + (roadScrollOffset % dashCycle);
        ctx.fillRect(lineX, dashY, 4, dashLength);
      }
    }
  }

  // --- UI Screens & HUD ---
  function drawHUD() {
    // Top Bar Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(14, 14, GAME_WIDTH - 28, 48, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Score Text
    ctx.textAlign = 'left';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SCORE', 32, 34);

    ctx.font = '800 18px Outfit, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(score.toLocaleString(), 32, 53);

    // Speed Text
    const speedMph = Math.round(currentSpeed * 0.35);
    ctx.textAlign = 'right';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SPEED', GAME_WIDTH - 32, 34);

    ctx.font = '800 18px Outfit, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${speedMph} MPH`, GAME_WIDTH - 32, 53);
  }

  function drawStartScreen(timestamp) {
    // Ambient Overlay
    ctx.fillStyle = 'rgba(11, 15, 25, 0.82)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title Card
    ctx.textAlign = 'center';

    // Game Logo / Tag
    ctx.font = '700 12px Outfit, sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('HIGHWAY RACER', GAME_WIDTH / 2, GAME_HEIGHT * 0.28);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    ctx.font = '900 36px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
    ctx.shadowBlur = 16;
    ctx.fillText('CAR DODGER', GAME_WIDTH / 2, GAME_HEIGHT * 0.35);
    ctx.shadowBlur = 0;

    // Controls Panel
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.roundRect(40, GAME_HEIGHT * 0.43, GAME_WIDTH - 80, 110, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();

    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('CONTROLS', GAME_WIDTH / 2, GAME_HEIGHT * 0.48);

    ctx.font = '700 15px Outfit, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('← →  or  A / D', GAME_WIDTH / 2, GAME_HEIGHT * 0.53);

    ctx.font = '500 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Steer left and right to dodge cars', GAME_WIDTH / 2, GAME_HEIGHT * 0.57);

    // Pulsing Start Prompt
    const pulse = 0.65 + 0.35 * Math.sin(timestamp * 0.005);
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillText('Press SPACE or ENTER to Start', GAME_WIDTH / 2, GAME_HEIGHT * 0.73);
  }

  function drawGameOverScreen(timestamp) {
    // Backdrop Tint
    ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';

    // Game Over Title
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT * 0.28);
    ctx.shadowBlur = 0;

    // Results Card
    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.beginPath();
    ctx.roundRect(40, GAME_HEIGHT * 0.34, GAME_WIDTH - 80, 160, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();

    // Final Score
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('FINAL SCORE', GAME_WIDTH / 2, GAME_HEIGHT * 0.40);

    ctx.font = '800 32px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(score.toLocaleString(), GAME_WIDTH / 2, GAME_HEIGHT * 0.46);

    // High Score
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('HIGH SCORE', GAME_WIDTH / 2, GAME_HEIGHT * 0.52);

    ctx.font = '700 20px Outfit, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(highScore.toLocaleString(), GAME_WIDTH / 2, GAME_HEIGHT * 0.56);

    // Pulsing Restart Prompt
    const pulse = 0.65 + 0.35 * Math.sin(timestamp * 0.005);
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillText('Press SPACE or ENTER to Restart', GAME_WIDTH / 2, GAME_HEIGHT * 0.73);
  }

  // --- Main Render Function ---
  function render(timestamp) {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 1. Always Draw Road
    drawRoad();

    // 2. Draw Enemy Cars
    for (let enemy of enemies) {
      drawCar(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color, false);
    }

    // 3. Draw Player Car
    // Compute subtle tilt angle from horizontal velocity
    const tilt = player.vx * 0.0003;
    drawCar(player.x, player.y, player.width, player.height, player.color, true, tilt);

    // 4. State-Dependent Overlays
    if (currentState === STATE.PLAYING) {
      drawHUD();
    } else if (currentState === STATE.START) {
      drawStartScreen(timestamp);
    } else if (currentState === STATE.GAMEOVER) {
      drawGameOverScreen(timestamp);
    }
  }

  // --- Master Game Loop ---
  let lastTimestamp = performance.now();

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1); // Clamp delta to avoid large jumps
    lastTimestamp = timestamp;

    update(dt);
    render(timestamp);

    requestAnimationFrame(loop);
  }

  // Kick off loop
  requestAnimationFrame(loop);
})();
