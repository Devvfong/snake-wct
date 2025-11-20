// game.js — main module (container-fullscreen ready)

import { Renderer } from "./game.renderer.js";
import { Input } from "./game.input.js";
import { Storage } from "./game.storage.js";

const TILE = 22; // tile size used to compute grid

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // the container element that holds the canvas (the card)
    this.cardGameEl = document.querySelector(".card-game");

    // set initial canvas size and compute cols/rows
    this.resizeCanvas();

    this.renderer = new Renderer(this.ctx, TILE, this.cols, this.rows);
    this.input = new Input();
    this.storage = new Storage("snake_desktop_best_v1");

    // UI elements
    this.scoreEl = document.getElementById("score");
    this.levelEl = document.getElementById("level");
    this.speedEl = document.getElementById("speed");
    this.bestEl = document.getElementById("best");
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.muteBtn = document.getElementById("muteBtn");
    this.overlay = document.getElementById("overlay");
    this.msgText = document.getElementById("msgText");
    this.overlayStart = document.getElementById("overlayStart");

    // Bind UI events
    this.startBtn.addEventListener("click", () => this.start());
    this.pauseBtn.addEventListener("click", () => this.togglePause());
    this.muteBtn.addEventListener("click", () => this.toggleMute());
    this.overlayStart.addEventListener("click", () => this.start());

    // toolbar quick buttons (copied into game card) — forward to same handlers
    const startTool = document.getElementById("startBtn-tool");
    const pauseTool = document.getElementById("pauseBtn-tool");
    const muteTool = document.getElementById("muteBtn-tool");
    if (startTool) startTool.addEventListener("click", () => this.start());
    if (pauseTool)
      pauseTool.addEventListener("click", () => this.togglePause());
    if (muteTool) muteTool.addEventListener("click", () => this.toggleMute());

    // persistent best score
    this.best = this.storage.get() || 0;
    this.bestEl.textContent = this.best;

    this.loopHandle = null;
    this._rafHandle = null;
    this._lastFrameTime = 0;
    this._accumulator = 0;
    this._canvasMessage = null;

    // resize handling
    window.addEventListener("resize", () => this.onWindowResize());

    // handle fullscreen changes
    document.addEventListener("fullscreenchange", () =>
      this.onFullscreenChange()
    );

    // NOTE: keyboard handling is centralized in `Input` (game.input.js)

    // initialize game state
    this.reset();

    // ensure overlay element is hidden — user prefers no modal overlay
    try {
      if (this.overlay) this.overlay.style.display = "none";
    } catch (e) {}

    // wire input events from the Input wrapper
    this.input.on("dir", (d) => {
      // prevent reversing into self
      if (!(d.x === -this.dir.x && d.y === -this.dir.y)) {
        this.dir = d;
      }
    });
    this.input.on("pause", () => this.togglePause());
    this.input.on("mute", () => this.toggleMute());
    this.input.on("fullscreen", () => this.togglePresentationFullscreen());
    // Start the game with Enter or Space when not already running
    this.input.on("start", () => {
      if (!this.isRunning) this.start();
    });

    // wire touch controls if present (mobile buttons)
    const bindBtn = (id, dir) => {
      const el = document.getElementById(id);
      if (!el) return;
      const handler = (ev) => {
        ev.preventDefault();
        this.input.trigger("dir", dir);
      };
      el.addEventListener("touchstart", handler, { passive: false });
      el.addEventListener("mousedown", handler);
    };

    bindBtn("btn-up", { x: 0, y: -1 });
    bindBtn("btn-down", { x: 0, y: 1 });
    bindBtn("btn-left", { x: -1, y: 0 });
    bindBtn("btn-right", { x: 1, y: 0 });
  }

  // set canvas pixel size to fit current container or fullscreen element
  resizeCanvas() {
    // Check if an element is currently fullscreen (browser-level)
    const fsEl = document.fullscreenElement;

    // Determine target width/height in CSS pixels
    let targetW, targetH;

    if (fsEl) {
      // Use the fullscreen element's inner size (it may be the .card-game)
      targetW = fsEl.clientWidth;
      targetH = fsEl.clientHeight;
    } else if (document.body.classList.contains("app-fullscreen")) {
      // fallback: if we applied the presentation class but no native fullscreen,
      // use the viewport size so it looks like fullscreen
      targetW = window.innerWidth;
      targetH = window.innerHeight;
    } else {
      // Normal mode: size based on the canvas's visible CSS size (clientWidth/Height)
      const cs = this.canvas.getBoundingClientRect();
      targetW = Math.max(320, Math.floor(cs.width));
      targetH = Math.max(240, Math.floor(cs.height));
    }

    // account for high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(targetW * dpr);
    this.canvas.height = Math.floor(targetH * dpr);

    // keep CSS size for layout (keeps canvas displayed correctly)
    this.canvas.style.width = targetW + "px";
    this.canvas.style.height = targetH + "px";

    // scale drawing operations to device pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // recompute grid in CSS pixels
    this.cols = Math.max(5, Math.floor(targetW / TILE));
    this.rows = Math.max(5, Math.floor(targetH / TILE));

    // update renderer
    if (this.renderer) {
      this.renderer.tile = TILE;
      this.renderer.cols = this.cols;
      this.renderer.rows = this.rows;
    }
  }

  onWindowResize() {
    const oldCols = this.cols;
    const oldRows = this.rows;
    this.resizeCanvas();

    // clamp snake positions to new grid instead of resetting game
    if (this.snake && this.snake.length) {
      this.snake = this.snake.map((s) => ({
        x: Math.min(Math.max(0, s.x), this.cols - 1),
        y: Math.min(Math.max(0, s.y), this.rows - 1),
      }));
    }

    // ensure food is inside bounds; respawn if outside
    if (
      !this.food ||
      this.food.x < 0 ||
      this.food.x >= this.cols ||
      this.food.y < 0 ||
      this.food.y >= this.rows
    ) {
      this.spawnFood();
    }
    // re-render at new size
    this.renderer.render(this.snake, this.food);
  }

  onFullscreenChange() {
    // When user enters/exits fullscreen (Esc), update CSS class and resize
    const isFs = !!document.fullscreenElement;
    if (!isFs) {
      // Clean up: remove presentation class if present
      document.body.classList.remove("app-fullscreen");
    }
    // Always recompute sizes
    this.resizeCanvas();

    // clamp positions rather than resetting
    if (this.snake && this.snake.length) {
      this.snake = this.snake.map((s) => ({
        x: Math.min(Math.max(0, s.x), this.cols - 1),
        y: Math.min(Math.max(0, s.y), this.rows - 1),
      }));
    }
    if (
      !this.food ||
      this.food.x < 0 ||
      this.food.x >= this.cols ||
      this.food.y < 0 ||
      this.food.y >= this.rows
    ) {
      this.spawnFood();
    }
    this.renderer.render(this.snake, this.food);
  }

  async togglePresentationFullscreen() {
    // Toggle CSS class for presentation visuals
    const isPresentation = document.body.classList.contains("app-fullscreen");
    if (!isPresentation) {
      // Add class to apply CSS fullscreen styles
      document.body.classList.add("app-fullscreen");

      // Prefer requesting fullscreen on the container element (cardGameEl)
      // so the canvas remains visually inside the card.
      if (this.cardGameEl && this.cardGameEl.requestFullscreen) {
        try {
          await this.cardGameEl.requestFullscreen();
        } catch (err) {
          // If requestFullscreen fails (blocked), we still keep the CSS class
          // so canvas will fill viewport by our CSS rules.
        }
      } else {
        // if no element fullscreen support, the CSS class still applies
      }
      // Resize to the (now larger) container size
      this.resizeCanvas();
      this.reset();
    } else {
      // Exit presentation mode
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (e) {
        // ignore
      }
      document.body.classList.remove("app-fullscreen");
      this.resizeCanvas();
      this.reset();
    }
  }

  reset(showOverlay = true) {
    // place snake in center of current grid
    this.snake = [
      { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) },
    ];
    this.dir = { x: 1, y: 0 };
    this.spawnFood();
    this.score = 0;
    this.level = 1;
    this.baseSpeed = 6;
    this.speed = this.baseSpeed;
    this.isRunning = false;
    this.isPaused = false;
    this.muted = false;
    this.updateUI();
    if (showOverlay) this.showOverlay("Press Start to play!");
    else this.hideOverlay();
    this.renderer.render(this.snake, this.food, this._canvasMessage);
  }

  spawnFood() {
    let tries = 0;
    while (true) {
      tries++;
      const fx = Math.floor(Math.random() * (this.cols - 2)) + 1;
      const fy = Math.floor(Math.random() * (this.rows - 2)) + 1;
      if (!this.snake.some((s) => s.x === fx && s.y === fy)) {
        // choose a random color for the food from a 7-color palette
        const palette = [
          "#ff6b6b",
          "#ffb86b",
          "#ffd36b",
          "#6bff8a",
          "#6bd2ff",
          "#8b6bff",
          "#ff6bd1",
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];
        this.food = { x: fx, y: fy, color };
        return;
      }
      if (tries > 300) {
        const palette = [
          "#ff6b6b",
          "#ffb86b",
          "#ffd36b",
          "#6bff8a",
          "#6bd2ff",
          "#8b6bff",
          "#ff6bd1",
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];
        this.food = { x: 1, y: 1, color };
        return;
      }
    }
  }

  start() {
    // Start a fresh game: reset state (without showing overlay) then start loop
    this.reset(false);
    this.isRunning = true;
    this.isPaused = false;
    this.hideOverlay();
    this.startLoop();
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) this.showOverlay("Paused — Press P to resume");
    else this.hideOverlay();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.muteBtn.textContent = this.muted ? "Unmute" : "Mute";
  }

  startLoop() {
    // If RAF loop already running, do nothing
    if (this._rafHandle) return;
    this._lastFrameTime = performance.now();
    this._accumulator = 0;
    this._rafHandle = requestAnimationFrame((t) => this._frame(t));
    this.updateUI();
  }

  stopLoop() {
    if (this._rafHandle) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
  }

  _frame(now) {
    if (!this.isRunning || this.isPaused) {
      this._rafHandle = null;
      return;
    }

    const dt = now - this._lastFrameTime;
    this._lastFrameTime = now;

    // dynamic timestep based on current speed (ms per tick)
    const step = Math.max(35, 1000 / this.speed);
    this._accumulator += dt;

    // run as many fixed ticks as needed
    let ran = 0;
    while (this._accumulator >= step && ran < 4) {
      this.tick();
      this._accumulator -= step;
      ran++;
    }

    // schedule next frame
    this._rafHandle = requestAnimationFrame((t) => this._frame(t));
  }

  tick() {
    if (!this.isRunning || this.isPaused) return;

    const head = { ...this.snake[0] };
    head.x += this.dir.x;
    head.y += this.dir.y;

    // wall collision
    if (
      head.x < 0 ||
      head.x >= this.cols ||
      head.y < 0 ||
      head.y >= this.rows
    ) {
      this.gameOver();
      return;
    }

    // self collision
    if (this.snake.some((p, i) => i > 0 && p.x === head.x && p.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    // food eaten
    if (this.food && head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      if (!this.muted) this.beep(500, 70);
      this.spawnFood();

      if (this.score % 5 === 0) {
        this.level++;
        this.speed = this.baseSpeed + (this.level - 1) * 1.5;
        this.startLoop();
      }
    } else {
      this.snake.pop();
    }

    if (this.score > this.best) {
      this.best = this.score;
      this.storage.set(this.best);
      this.bestEl.textContent = this.best;
    }

    this.updateUI();
    this.renderer.render(this.snake, this.food, this._canvasMessage);
  }

  gameOver() {
    this.isRunning = false;
    this.showOverlay(
      `Game Over — Score: ${this.score} <br><small class="small">Press Start to try again</small>`
    );
    if (!this.muted) this.beep(180, 210);
  }

  beep(freq = 300, duration = 80, vol = 0.06) {
    try {
      if (this.muted) return;
      if (!this.audio)
        this.audio = new (window.AudioContext || window.webkitAudioContext)();
      const o = this.audio.createOscillator();
      const g = this.audio.createGain();
      o.connect(g);
      g.connect(this.audio.destination);
      o.frequency.value = freq;
      g.gain.value = vol;
      o.start();
      setTimeout(() => o.stop(), duration);
    } catch (e) {
      // ignore audio errors
    }
  }

  updateUI() {
    this.scoreEl.textContent = this.score;
    this.levelEl.textContent = this.level;
    this.speedEl.textContent = Math.round(this.speed);
    // update small live status for screen readers / header
    try {
      const status = document.getElementById("gameStatus");
      if (status) {
        if (!this.isRunning) status.textContent = "Idle — press Start";
        else if (this.isPaused)
          status.textContent = `Paused — Score: ${this.score}`;
        else status.textContent = `Score: ${this.score} — Level: ${this.level}`;
      }
    } catch (e) {}
  }

  showOverlay(html) {
    // Instead of showing a DOM modal overlay, render a small in-canvas message.
    try {
      if (this.msgText) this.msgText.innerHTML = html; // keep DOM text for a11y
    } catch (e) {}
    this._canvasMessage = html;
    try {
      this.renderer.render(this.snake, this.food, this._canvasMessage);
    } catch (e) {}
  }

  hideOverlay() {
    // Clear canvas message
    this._canvasMessage = null;
    try {
      this.renderer.render(this.snake, this.food, this._canvasMessage);
    } catch (e) {}
  }
}

// bootstrap
const canvas = document.getElementById("game");
const game = new Game(canvas);
window.game = game; // expose for debugging
export default game;
