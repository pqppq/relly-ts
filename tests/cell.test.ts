import { Cell } from "../src/utils/cell";
import { Result, Ok, Err } from "../src/utils/result";

type Point = {
  x: number;
  y: number;
};

test("test  unwrap", (): void => {
  const cell = new Cell(1);
  const value = cell.unwrap();

  expect(value).toBe(1);
});

test("test replace", (): void => {
  const cell = new Cell(1);
  cell.replace(5);
  const value = cell.unwrap();

  expect(value).toBe(5);
});

test("test replaceWith", (): void => {
  const cell = new Cell(1);
  cell.replaceWith((x: number) => 5 * x);
  const value = cell.unwrap();

  expect(value).toBe(5);
});

test("test swap", (): void => {
  const cellA = new Cell("A");
  const cellB = new Cell("B");
  cellA.swap(cellB);
  const valueA = cellA.unwrap();
  const valueB = cellB.unwrap();

  expect(valueA).toBe("B");
  expect(valueB).toBe("A");
});

test("test clone", (): void => {
  const point: Point = { x: 1, y: 2 };
  const cell = new Cell(point);
  const original = cell.unwrap();

  const result = cell.clone();

  if (result.isOk()) {
    const cloned = result.value;
    cloned.x = 0;
    expect(original.x).toBe(1);
  }
});

test("test consume", (): void => {
  const cell = new Cell(1);
  const result = cell.consume((value: number): number => {
    return 5 * value;
  });

  expect(result.value).toBe(5);
});

test("test fail", (): void => {
  // TODO
});
