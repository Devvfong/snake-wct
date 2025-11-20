// game.renderer.js — simple renderer module
export class Renderer {
  constructor(ctx, tile, cols, rows) {
    this.ctx = ctx;
    this.tile = tile;
    this.cols = cols;
    this.rows = rows;
  }

  render(snake, food) {
    const ctx = this.ctx;
    const TILE = this.tile;

    // determine drawing surface size in CSS pixels (account for devicePixelRatio)
    const dpr =
      ctx.getTransform && ctx.getTransform().a ? ctx.getTransform().a : 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    // clear & background (use CSS pixel dimensions)
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#07192a";
    ctx.fillRect(0, 0, w, h);

    // draw snake (head is red, body remains green)
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      const px = s.x * TILE;
      const py = s.y * TILE;
      ctx.fillStyle = i === 0 ? "#ff4d4d" : "#2bb673";
      this._roundRect(ctx, px + 2, py + 2, TILE - 4, TILE - 4, 6, true, false);
    }

    // draw food
    if (food) {
      const fx = food.x * TILE;
      const fy = food.y * TILE;
      const fcol = food.color ? food.color : "#ff6b6b";
      ctx.fillStyle = fcol;
      ctx.beginPath();
      ctx.arc(fx + TILE / 2, fy + TILE / 2, TILE * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // small highlight on food (slightly lighter)
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.arc(fx + TILE * 0.7, fy + TILE * 0.35, TILE * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }

    // subtle border (use CSS pixel dimensions)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);

    // optional centered message (small, subtle)
    if (typeof arguments !== "undefined" && arguments.length > 2) {
      const msg = arguments[2];
      if (msg) {
        ctx.save();
        ctx.fillStyle = "rgba(230,238,246,0.92)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontSize = Math.max(12, Math.min(28, TILE));
        ctx.font = `bold ${fontSize}px Inter, system-ui, Arial`;
        // draw a semi-transparent rounded backdrop for contrast
        const lines = String(msg)
          .split("<br>")
          .map((l) => l.replace(/<[^>]*>/g, "").trim());
        const lineHeight = fontSize * 1.2;
        const boxW =
          Math.max(...lines.map((l) => ctx.measureText(l).width)) + 34;
        const boxH = lines.length * lineHeight + 26;
        const cx = w / 2;
        const cy = h / 2;

        // backdrop
        ctx.fillStyle = "rgba(2,8,23,0.85)";
        const rx = cx - boxW / 2;
        const ry = cy - boxH / 2;
        const br = 12;
        this._roundRect(ctx, rx, ry, boxW, boxH, br, true, false);

        // text
        ctx.fillStyle = "rgba(230,238,246,0.94)";
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(
            lines[i],
            cx,
            cy - ((lines.length - 1) * lineHeight) / 2 + i * lineHeight
          );
        }
        ctx.restore();
      }
    }
  }

  _roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === "undefined") r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
