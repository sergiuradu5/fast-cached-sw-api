export const arrayFromRange = (start: number, end: number): Array<number> =>
  Array.from({ length: end - start + 1 }, (v, k) => k + start);
