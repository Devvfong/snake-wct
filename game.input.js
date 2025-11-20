// input module — keyboard input wrapper that emits simple events
export class Input {
  constructor() {
    this.lastKeyTime = 0;
    this._listeners = {};
    this._bound = this._onKeyDown.bind(this);
    // start listening immediately
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("keydown", this._bound);
    }
  }

  on(name, fn) {
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(fn);
  }

  off(name, fn) {
    if (!this._listeners[name]) return;
    this._listeners[name] = this._listeners[name].filter((f) => f !== fn);
  }

  _emit(name, data) {
    (this._listeners[name] || []).forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        /* swallow handler errors */
      }
    });
  }

  // programmatically trigger an input event (useful for touch buttons)
  trigger(name, data) {
    this._emit(name, data);
  }

  _onKeyDown(e) {
    const now = Date.now();
    if (now - this.lastKeyTime < 40) return;
    this.lastKeyTime = now;
    const k = e && e.key ? e.key.toLowerCase() : "";
    const code = e && e.code ? e.code : "";
    if (k === "arrowup" || k === "w") {
      this._emit("dir", { x: 0, y: -1 });
    } else if (k === "arrowdown" || k === "s") {
      this._emit("dir", { x: 0, y: 1 });
    } else if (k === "arrowleft" || k === "a") {
      this._emit("dir", { x: -1, y: 0 });
    } else if (k === "arrowright" || k === "d") {
      this._emit("dir", { x: 1, y: 0 });
    } else if (k === "p") {
      this._emit("pause");
    } else if (k === "m") {
      this._emit("mute");
    } else if (k === "f") {
      this._emit("fullscreen");
    } else if (k === "enter") {
      // Enter key starts the game
      try {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
      } catch (er) {}
      this._emit("start");
    } else if (k === " " || k === "spacebar" || code === "Space") {
      // Space bar also starts the game (handle older key names and code)
      try {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
      } catch (er) {}
      this._emit("start");
    }
  }

  destroy() {
    if (typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("keydown", this._bound);
    }
    this._listeners = {};
  }
}
