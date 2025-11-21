var canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  scoreIs = document.getElementById("score"),
  direction = "",
  directionQueue = "",
  fps = 70,
  snake = [],
  snakeLength = 5,
  cellSize = 20,
  snakeColor = "#581313bd",
  headColor = "#fa048bff",
  headStroke = "#1e8449",
  foodColor = "#ff3636",
  score = 0;
const MAX_FOOD_ITEMS = 1;
let foods = [];
var loop;
var isRunning = false;
var hit = new Audio("hit.wav");
var pick = new Audio("hit.wav");
// makes canvas interactive upon load
canvas.setAttribute("tabindex", 1);
canvas.style.outline = "none";
canvas.focus();
window.addEventListener("keydown", handleKeyInput);
// draws a square.. obviously
function drawSquare(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, cellSize, cellSize);
}
function getRandomCellPosition() {
  const cols = Math.floor(canvas.width / cellSize);
  const rows = Math.floor(canvas.height / cellSize);
  return {
    x: Math.floor(Math.random() * cols) * cellSize,
    y: Math.floor(Math.random() * rows) * cellSize,
  };
}

function isPositionOccupied(x, y) {
  for (let segment of snake) {
    if (segment.x === x && segment.y === y) {
      return true;
    }
  }
  for (let existing of foods) {
    if (existing.x === x && existing.y === y) {
      return true;
    }
  }
  return false;
}

function spawnFoodItem() {
  if (foods.length >= MAX_FOOD_ITEMS) {
    return;
  }

  let attempts = 0;
  while (attempts < 128) {
    const candidate = getRandomCellPosition();
    attempts += 1;
    if (!isPositionOccupied(candidate.x, candidate.y)) {
      foods.push(candidate);
      return;
    }
  }
}

function ensureFoodCount() {
  while (foods.length < MAX_FOOD_ITEMS) {
    spawnFoodItem();
  }
}
function pauseGame() {
  if (!isRunning) return; // already paused
  isRunning = false;

  if (loop) {
    clearInterval(loop);
    loop = null;
  }
}

function resumeGame() {
  if (isRunning) return; // already running
  isRunning = true;

  // restart the interval
  loop = setInterval(game, fps);
}

function togglePause() {
  if (isRunning) {
    pauseGame();
    return false; // now paused
  } else {
    resumeGame();
    return true; // now running
  }
}
// drawing food on the canvas
function drawFood() {
  for (let item of foods) {
    drawSquare(item.x, item.y, foodColor);
  }
}
// setting the colors for the canvas. color1 - the background, color2 - the line color
// drawing the background and grid correctly using canvas.width and canvas.height
function setBackground(color1, color2) {
  ctx.fillStyle = color1;
  ctx.strokeStyle = color2;

  // Use (width, height) in the right order:
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  // draw vertical grid lines using canvas.width
  for (var x = 0.5; x < canvas.width; x += cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  // draw horizontal grid lines using canvas.height
  for (var y = 0.5; y < canvas.height; y += cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }

  ctx.stroke();
}

// creating the snake and pushing coordinates to the array
function createSnake() {
  snake = [];
  for (let i = snakeLength; i > 0; i--) {
    k = i * cellSize;
    snake.push({ x: k, y: 0 });
  }
}
// loops through the snake array and draws each element
function drawSnake() {
  for (let i = 1; i < snake.length; i++) {
    drawRoundedBody(snake[i].x, snake[i].y, snakeColor);
  }
  drawHead(snake[0].x, snake[0].y);
}
function drawRoundedBody(x, y, color) {
  ctx.fillStyle = color;
  const r = cellSize * 0.3; // corner radius

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + cellSize - r, y);
  ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + r);
  ctx.lineTo(x + cellSize, y + cellSize - r);
  ctx.quadraticCurveTo(
    x + cellSize,
    y + cellSize,
    x + cellSize - r,
    y + cellSize
  );
  ctx.lineTo(x + r, y + cellSize);
  ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
}

function drawHead(x, y) {
  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;
  const radius = cellSize / 2 - 1;

  // Draw head circle
  ctx.beginPath();
  ctx.fillStyle = headColor;
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = headStroke;
  ctx.stroke();
  ctx.closePath();

  // ======== ADD EYES =========
  const eyeSize = Math.max(2, cellSize * 0.15);

  // Eye positions (relative to head direction)
  let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

  if (direction === "right") {
    leftEyeX = centerX + cellSize * 0.15;
    rightEyeX = centerX + cellSize * 0.15;
    leftEyeY = centerY - cellSize * 0.2;
    rightEyeY = centerY + cellSize * 0.2;
  } else if (direction === "left") {
    leftEyeX = centerX - cellSize * 0.15;
    rightEyeX = centerX - cellSize * 0.15;
    leftEyeY = centerY - cellSize * 0.2;
    rightEyeY = centerY + cellSize * 0.2;
  } else if (direction === "up") {
    leftEyeY = centerY - cellSize * 0.15;
    rightEyeY = centerY - cellSize * 0.15;
    leftEyeX = centerX - cellSize * 0.2;
    rightEyeX = centerX + cellSize * 0.2;
  } else if (direction === "down") {
    leftEyeY = centerY + cellSize * 0.15;
    rightEyeY = centerY + cellSize * 0.15;
    leftEyeX = centerX - cellSize * 0.2;
    rightEyeX = centerX + cellSize * 0.2;
  }

  // Draw eyes
  ctx.fillStyle = "#000"; // black
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
  ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
}

function handleKeyInput(evt) {
  var key = evt.keyCode || evt.which;
  var navigationalKeys = [32, 13, 37, 38, 39, 40, 65, 68, 83, 87];
  if (navigationalKeys.includes(key)) {
    evt.preventDefault();
  }
  if (!isRunning && (key === 32 || key === 13)) {
    evt.preventDefault();
    newGame();
    return;
  }
  changeDirection(key);
}

function showGameOverMessage() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 32px Verdana";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "16px Verdana";
  ctx.fillText(
    "Press Space or Enter to restart",
    canvas.width / 2,
    canvas.height / 2 + 25
  );
  ctx.restore();
}

function endGame() {
  isRunning = false;
  if (loop) {
    clearInterval(loop);
    loop = null;
  }
  setBackground("#fff", "#eee");
  drawSnake();
  drawFood();
  showGameOverMessage();
}
// keyboard interactions | direction != '...' doesn't let the snake go backwards
function changeDirection(keycode) {
  // Check for Left Arrow (37) OR A key (65)
  if ((keycode === 37 || keycode === 65) && direction !== "right") {
    directionQueue = "left";
  }
  // Check for Up Arrow (38) OR W key (87)
  else if ((keycode === 38 || keycode === 87) && direction !== "down") {
    directionQueue = "up";
  }
  // Check for Right Arrow (39) OR D key (68)
  else if ((keycode === 39 || keycode === 68) && direction !== "left") {
    directionQueue = "right";
  }
  // Check for Down Arrow (40) OR S key (83)
  else if ((keycode === 40 || keycode === 83) && direction !== "up") {
    // Note: Corrected "top" to "up" in the original logic
    directionQueue = "down";
  }
}
// changing the snake's movement
function moveSnake() {
  var x = snake[0].x; // getting the head coordinates...hhehehe... getting head..
  // anyway... read on...
  var y = snake[0].y;

  direction = directionQueue;

  if (direction == "right") {
    x += cellSize;
  } else if (direction == "left") {
    x -= cellSize;
  } else if (direction == "up") {
    y -= cellSize;
  } else if (direction == "down") {
    y += cellSize;
  }
  // removes the tail and makes it the new head...very delicate, don't touch this
  var tail = snake.pop();
  tail.x = x;
  tail.y = y;
  snake.unshift(tail);
}
// checks if too coordinates match up
function checkCollision(x1, y1, x2, y2) {
  if (x1 == x2 && y1 == y2) {
    return true;
  } else {
    return false;
  }
}
// main game loop
function game() {
  var head = snake[0];
  // checking for wall collisions
  if (
    head.x < 0 ||
    head.x > canvas.width - cellSize ||
    head.y < 0 ||
    head.y > canvas.height - cellSize
  ) {
    hit.play();
    endGame();
    return;
  }
  // checking for colisions with snake's body
  for (let i = 1; i < snake.length; i++) {
    if (head.x == snake[i].x && head.y == snake[i].y) {
      hit.play(); // playing sounds
      endGame();
      return;
    }
  }
  // checking for collision with food
  const eatenIndex = foods.findIndex((f) =>
    checkCollision(head.x, head.y, f.x, f.y)
  );
  if (eatenIndex > -1) {
    snake[snake.length] = { x: head.x, y: head.y };
    foods.splice(eatenIndex, 1);
    spawnFoodItem();
    pick.play();
    score += 10;
  }

  ctx.beginPath();
  setBackground("#fff", "#eee");
  scoreIs.innerHTML = score;
  drawSnake();
  drawFood();
  moveSnake();
}
function newGame() {
  direction = "right"; // initial direction
  directionQueue = "right";
  ctx.beginPath();
  createSnake();
  foods = [];
  ensureFoodCount();
  canvas.focus();

  if (loop) {
    clearInterval(loop);
  }
  score = 0;
  scoreIs.innerHTML = score;
  loop = setInterval(game, fps);
  isRunning = true;
}
newGame();

var pauseBtn = document.getElementById("pauseBtn");
if (pauseBtn) {
  pauseBtn.addEventListener("click", function () {
    var running = togglePause();
    pauseBtn.textContent = running ? "Pause" : "Resume";
  });
}
var playBtn = document.getElementById("playBtn");

if (playBtn) {
  playBtn.addEventListener("click", function () {
    if (!isRunning) {
      newGame(); // start a new game if not running
      playBtn.textContent = "Playing...";
      setTimeout(() => {
        playBtn.textContent = "Play";
      }, 1000);
    }
  });
}
