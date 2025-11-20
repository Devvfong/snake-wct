// small wrapper around localStorage for best score
export class Storage {
  constructor(key) {
    this.key = key;
  }

  get() {
    try {
      return parseInt(localStorage.getItem(this.key) || "0", 10);
    } catch (e) {
      return 0;
    }
  }

  set(val) {
    try {
      localStorage.setItem(this.key, String(val));
    } catch (e) {}
  }
}
