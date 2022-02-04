const path = require('path'),
  { Worker } = require('worker_threads');

class Pool {
  #freeWorkers = new Set();
  #workingWorkers = new Map();
  #waitingTask = [];

  constructor(file, threadsNumber) {
    for (let i = 0; i < threadsNumber; i++) {
      this.#createWorker(file);
    }
  }

  #createWorker(file) {
    const worker = new Worker(file);
    worker
      .on("message", (result) => {
        this.#getCallbacks(worker).resolve(result);

        if (this.#waitingTask.length) {
          const { data, resolve, reject } = this.#waitingTask.pop();
          this.#postMessage(worker, data, resolve, reject);
        } else {
          this.#freeWorkers.add(worker);
        }
      })
      .on("error", (err) => {
        console.error(err);
        this.#getCallbacks(worker).reject(err);
        this.#freeWorkers.delete(worker);
        this.#createWorker(file);
      });

    this.#freeWorkers.add(worker);
  }

  #getCallbacks(worker) {
    const callback = this.#workingWorkers.get(worker);
    this.#workingWorkers.delete(worker);
    return callback;
  }

  #postMessage(worker, data, resolve, reject) {
    worker.postMessage(data);
    this.#workingWorkers.set(worker, { resolve, reject });
  }

  runTask(data) {
    return new Promise((resolve, reject) => {
      if (!this.#freeWorkers.size) {
        this.#waitingTask.push({
          data,
          resolve,
          reject
        });
        return;
      }

      const worker = this.#freeWorkers.values().next().value;
      this.#freeWorkers.delete(worker);
      this.#postMessage(worker, data, resolve, reject);
    });
  }

  destroy() {
    if (this.#workingWorkers.size || this.#waitingTask.length) {
      throw new Error('Cannot destory');
    }

    for (const worker of this.#freeWorkers) {
      worker.terminate();
    }
  }
}

module.exports = Pool;
