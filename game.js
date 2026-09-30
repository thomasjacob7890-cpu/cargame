/**
 * 2D Car Dodging Game - Step 3: Player Car Movement
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Road layout
const ROAD_LEFT = 50;
const ROAD_RIGHT = 350;
const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
const NUM_LANES = 3;
const LANE_WIDTH = ROAD_WIDTH / NUM_LANES;

// Road scrolling parameters
const ROAD_SPEED = 300; // pixels per second (constant speed)
const DASH_LENGTH = 35;
const DASH_GAP = 25;
const DASH_CYCLE = DASH_LENGTH + DASH_GAP;

let roadOffset = 0;
let lastTime = 0;

// Player car setup
const player = {
  width: 40,
  height: 70,
  x: CANVAS_WIDTH / 2 - 20, // centered on road
  y: CANVAS_HEIGHT - 90,     // near bottom of road
  speed: 280,               // pixels per second
  color: '#06b6d4'          // colored rectangle
};

// Input handling
const keys = {
  left: false,
  right: false
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = true;
    e.preventDefault();
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = false;
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = false;
  }
});

function update(deltaTime) {
  // Continuously scroll the road downward at constant speed
  roadOffset = (roadOffset + ROAD_SPEED * deltaTime) % DASH_CYCLE;

  // Move player left/right with delta time
  if (keys.left) {
    player.x -= player.speed * deltaTime;
  }
  if (keys.right) {
    player.x += player.speed * deltaTime;
  }

  // Clamp player to road edges
  if (player.x < ROAD_LEFT) {
    player.x = ROAD_LEFT;
  } else if (player.x + player.width > ROAD_RIGHT) {
    player.x = ROAD_RIGHT - player.width;
  }
}

function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Grass / road shoulder backdrop
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Gray road surface
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);

  // Solid white road edge lines
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ROAD_LEFT, 0, 4, CANVAS_HEIGHT);
  ctx.fillRect(ROAD_RIGHT - 4, 0, 4, CANVAS_HEIGHT);

  // White dashed lane divider lines
  ctx.fillStyle = '#ffffff';
  const startY = -DASH_CYCLE + roadOffset;

  for (let lane = 1; lane < NUM_LANES; lane++) {
    const lineX = ROAD_LEFT + lane * LANE_WIDTH - 2;

    for (let y = startY; y < CANVAS_HEIGHT + DASH_CYCLE; y += DASH_CYCLE) {
      ctx.fillRect(lineX, y, 4, DASH_LENGTH);
    }
  }

  // Draw player car (colored rectangle)
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop(currentTime) {
  if (!lastTime) {
    lastTime = currentTime;
  }

  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
