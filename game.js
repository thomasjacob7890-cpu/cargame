/**
 * 2D Car Dodging Game - Step 1: Canvas & Game Loop
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

// Ensure canvas resolution matches 400x600
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let lastTime = 0;

function update(deltaTime) {
  // Update logic with deltaTime (seconds)
}

function render() {
  // Clear canvas each frame
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Background fill
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function gameLoop(currentTime) {
  if (!lastTime) {
    lastTime = currentTime;
  }

  // Calculate delta time in seconds
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
