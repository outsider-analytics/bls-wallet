import alea from "alea";

export class Rng {
  private readonly randFunc: () => number;

  constructor(seed?: string) {
    this.randFunc = alea(seed);
  }

  random(): number {
    return this.randFunc();
  }

  int(min: number = 0, max: number = 1): number {
    return Math.floor(this.random() * max) + min;
  }

  item<T>(arr: T[]): T {
    return arr[this.int(0, arr.length)];
  }
}
