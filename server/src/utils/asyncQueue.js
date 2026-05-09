export class AsyncQueue {
  constructor() {
    this.running = false;
    this.queue = [];
  }

  push(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.runNext();
    });
  }

  async runNext() {
    if (this.running || this.queue.length === 0) return;
    this.running = true;
    const item = this.queue.shift();
    try {
      item.resolve(await item.task());
    } catch (error) {
      item.reject(error);
    } finally {
      this.running = false;
      this.runNext();
    }
  }
}
