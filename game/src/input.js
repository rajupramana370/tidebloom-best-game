// Keyboard and mouse state in one place: the world asks, this answers.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.clicked = false;
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    const toGame = (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    };
    canvas.addEventListener('mousemove', toGame);
    canvas.addEventListener('mousedown', (e) => {
      toGame(e);
      this.mouseDown = true;
      this.clicked = true;
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
  }

  axisX() {
    let x = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1;
    return x;
  }

  axisY() {
    let y = 0;
    if (this.keys.has('arrowup') || this.keys.has('w')) y -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) y += 1;
    return y;
  }

  dashHeld() {
    return this.keys.has('shift') || this.keys.has(' ');
  }

  // One-shot key queries: true only on the frame the key went down.
  takePress(...names) {
    for (const n of names) {
      if (this.pressed.has(n)) {
        this.pressed.delete(n);
        return true;
      }
    }
    return false;
  }

  takeClick() {
    const was = this.clicked;
    this.clicked = false;
    return was;
  }

  endFrame() {
    this.pressed.clear();
    this.clicked = false;
  }
}
