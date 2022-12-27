import { z } from "zod";

export type BaseResult<T> = {
  query: string;
  schema: T;
};

export type InferType<Result> = Result extends BaseResult<infer T>
  ? T extends z.ZodType
    ? z.infer<T>
    : never
  : never;

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
export type ValueOf<T> = T[keyof T];

export type AllOrNothing<T> = T | Partial<Record<keyof T, undefined>>;

type Base = { _id: string };
type Charmander = { _id: "004"; name: "Charmander"; hp: number };
type Squirtle = { _id: "007"; name: "Squirtle"; attack: number };
type Strong = { isStrong: true; strength: number };

type Pokemon = Base & (Base | Charmander) & (Base | Squirtle) & (Base | Strong);

const tryTheThing = (p: Pokemon) => {
  if ("name" in p && p.name === "Squirtle") {
    console.log(p.attack);
  }

  if ("isStrong" in p) {
    console.log(p.strength);
  }
};

// ---- TESTING
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;
