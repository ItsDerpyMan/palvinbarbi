export class iterId implements Iterator<number> {
  private id: number;

  constructor(num: number = 0) {
    this.id = num;
  }
  next(): IteratorResult<number> {
    const id = this.id;
    this.id += 1;
    return { value: id, done: false };
  }
  [Symbol.iterator](): Iterator<number> {
    return this;
  }
}

interface Player {
  id: number;
  points: number;
}
export class Rooms extends Array<Room> {
  getRooms(): string {
    return JSON.stringify(this);
  }
}
export class Room {
  readonly id: number;
  players: Player[];
  hasStarted: boolean;
  question: number;
  remainingTime: number;

  constructor(iter: iterId) {
    this.id = this.setId(iter);
    this.players = [];
    this.hasStarted = false;
    this.question = -1;
    this.remainingTime = -1;
  }
  setId(iter: iterId): number {
    return iter.next().value;
  }
  getId(): number {
    return this.id;
  }
  toString(): string {
    return `id: ${this.id} number of players: ${this.players.length} has started: ${this.hasStarted} | question: ${this.question} time: ${this.remainingTime}`;
  }
}
