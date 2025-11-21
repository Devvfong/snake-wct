# Helper Function Guide

## Purpose

This file highlights the existing helper functions in `canvas.js` and shows how you can call them or extract new helpers to keep the code readable and reusable. Use it when you want to add features, wire buttons, or refactor logic without rewriting the whole loop.

## Current Helpers You Can Use or Extend

### `drawSquare(x, y, color)`

Draws a square cell. Call it from anywhere you need a grid-aligned tile (snake body, food, future effects).

### `drawHead(x, y)`

Renders the snake head as a bright circle. Useful if you later want to highlight the head differently (flash, trail, etc.).

### `drawSnake()` and `drawFood()`

Used inside the main loop but you can call them individually (for example, if you add a “preview next level” feature).

### `moveSnake()`

Moves the snake forward by reusing the tail as the new head. You can call this from any shortcut or animation tweak as long as you keep `direction`/`directionQueue` updated.

### `changeDirection(keycode)`

Updates `directionQueue` based on valid keys and prevents reversing. If you want to add custom input (buttons, swipe, touch), call this helper with your computed keycodes instead of duplicating logic.

### `spawnFoodItem()` and `ensureFoodCount()`

Keep the `foods` pool populated. If you add power-ups or different food types, call `spawnFoodItem()` wherever you need to insert them (e.g., after a combo). `ensureFoodCount()` is safe to call after the snake eats or when resetting so the board is ready.

### `pauseGame()`, `resumeGame()`, `togglePause()`

Control the `setInterval` loop. `togglePause()` is already wired to the Pause button, but you can call `pauseGame()` or `resumeGame()` from any other UI (like a keyboard shortcut) if you want more control.

### `newGame()`

The main entry point that resets everything. Use this from restart buttons or even from other scripts to programmatically reset the board.

### `game()`

The central loop containing collision checks and render calls. You could wrap the repeated logic in a new helper like `renderFrame()` if you want to reorganize the loop.

## Suggestions for Custom Helpers

1. **`renderFrame()`** – moves the `setBackground`, `scoreIs.innerHTML`, `drawSnake`, and `drawFood` calls into one function; you then call it from `game()` for clarity.
2. **`updateDirectionQueue(key)`** – wraps the directional logic and returns early if the input is invalid; let `handleKeyInput` call this helper before `moveSnake()` uses it.
3. **`restartGame()`** – simply calls `endGame()` followed by `newGame()` and could be tied to a UI button.
4. **`spawnBonus()`** – uses `getRandomCellPosition` and `isPositionOccupied` (you can extract these helpers too) to place special items without interfering with existing food.

Let me know if you’d like me to add any of these helpers or wire them to buttons.
