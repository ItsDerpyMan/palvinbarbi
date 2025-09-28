import { createDefine } from "fresh";

export class Timer {
  private callback: () => void;
  private duration: number;
  private elapsed: number;
  private interval: number;

  constructor(callback: () => void, duration: number) {
    this.callback = callback;
    this.duration = duration;
    this.interval = this.set();
    this.elapsed = 0;
  }

  private set() {
    return setInterval(() => {
      this.elapsed++;
      if (this.elapsed >= this.duration) {
        this.elapsed = 0;
        this.callback();
      }
    }, 1000);
  }
  public stop() {
    if (this.interval) clearInterval(this.interval);
  }
}
// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  shared: string;
}

export const define = createDefine<State>();
