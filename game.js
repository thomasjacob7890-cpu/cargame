/**
 * 2D Car Dodging Game - Step 2: Scrolling Road
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

function update(deltaTime) {
  // Continuously scroll the road downward at constant speed
  roadOffset = (roadOffset + ROAD_SPEED * deltaTime) % DASH_CYCLE;
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
