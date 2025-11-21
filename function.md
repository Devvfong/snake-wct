# Project Workflow and Function Documentation

## Overview

This project implements a classic Snake game that runs on an HTML5 canvas. The flow is simple:

1. **Page load**: `index.html` loads `style.css` for styling and `canvas.js` for the game logic.
2. **Initialization**: `canvas.js` registers keyboard listeners, sets up the canvas, and calls `newGame()` to populate the board with the snake and food.
3. **Game loop (`game`)**: The game loop runs at `fps` intervals, checking for collisions, updating the snake, drawing the grid, and rendering food.
4. **Input handling**: Keyboard events (arrow keys, WASD, space/enter) control direction changes, pause/resume, and restarting the game after game over.
5. **Game over**: When the snake hits a wall or itself, `endGame()` stops the loop, overlays a Game Over message, and waits for the player to restart with Space/Enter.

## Key Functions

### `drawSquare(x, y, color)`

Draws a filled square at `x`, `y` of size `cellSize` using the provided `color`. Used by both snake body segments and food tiles.

### `getRandomCellPosition()`

Returns a random valid cell-aligned `(x, y)` coordinate inside the canvas while respecting `cellSize`. Ensures food aligns to the grid.

### `isPositionOccupied(x, y)`

Checks whether the provided position collides with any part of the snake or any currently rendered food item. Prevents overlapping food/snakes during spawn.

### `spawnFoodItem()`

Adds a new food object unless the food pool is full (`MAX_FOOD_ITEMS`). It attempts multiple random positions until an unoccupied spot is found.

### `ensureFoodCount()`

Keeps `foods` populated up to `MAX_FOOD_ITEMS`. Called during initialization and whenever the snake eats food to refill the pool immediately.

### `drawFood()`

Iterates over `foods` and renders each entry with `drawSquare`. Handles multiple concurrent food pieces on the board.

### `setBackground(color1, color2)`

Fills the canvas with `color1`, then draws a grid using `color2`. The grid helps players judge movement and align to the tile size.

### `createSnake()`

Initializes the `snake` array with `snakeLength` segments aligned horizontally. Called whenever a new game starts.

### `drawSnake()`

Renders every snake segment: the body via `drawSquare` and the head as a circular highlight using `drawHead`.

### `drawHead(x, y)`

Paints the snake's head as a circle with `headColor` fill and `headStroke` outline so players can track the leading segment visually.

### `handleKeyInput(evt)`

Processes all relevant keyboard events. Prevents default scrolling behavior for the controls, starts a new game on Space/Enter if the game is paused, and delegates movement keys to `changeDirection()`.

### `changeDirection(keycode)`

Updates `directionQueue` based on arrow or WASD keys while preventing reversals. The next `moveSnake()` call will consume this queued direction.

### `moveSnake()`

Moves the snake forward by reusing the tail segment as the new head position. Reads `directionQueue`, updates the head's coordinates, and unshifts the tail to maintain the correct length.

### `checkCollision(x1, y1, x2, y2)`

Returns `true` if two coordinates match exactly. Used for wall/food/snake segment detection.

### `game()`

The main loop invoked by `setInterval`. It checks for wall or self-collisions, handles food consumption, updates the score, draws the background, food, and snake, and finally moves the snake.

### `newGame()`

Resets game state: direction, snake, food pool, score, and restart the main loop with `setInterval`. Also re-focuses the canvas and ensures the pause button states are updated.

### `endGame()`

Stops the main loop, renders the final background/snake/food, and paints the "Game Over" overlay so the player knows to press Space/Enter.

### `pauseGame()` / `resumeGame()` / `togglePause()`

Manage pausing and resuming the `setInterval` loop. `togglePause()` is wired to the pause button and updates the label accordingly.

### `newGame()` (called at load)

Bootstraps the game automatically when the script loads so the board is ready immediately.
