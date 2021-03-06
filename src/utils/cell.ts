import clone from "clone";
import { Result, Ok, Err } from "./result";
import * as hash from "object-hash";

export class Cell<T> {
  /**
   * Creates a new Cell containing the given value.
   */
  constructor(
    private value: T,
    private borrowed: boolean = false,
    private ownerHash: string = ""
  ) {}

  /**
   * Return this cell is borrowed or not.
   */
  isBorrowed(): boolean {
    return this.borrowed;
  }

  /**
   * Set the contained value.
   */
  private set(value: T): void {
    this.value = value;
  }

  /**
   * Borrow the value to the object.
   */
  public borroweTo(obj: object): Result<T, string> {
    if (this.isBorrowed())
      return new Err("Fail to get value. The value is currently borrowed.");
    this.borrowed = true;
    this.ownerHash = hash.default(obj);
    return new Ok(this.value);
  }

  /**
   * Take back wrapped value from owner.
   */
  public takeBackFrom(obj: object): Result<string, string> {
    if (hash.default(obj) === this.ownerHash) {
      this.borrowed = false;
      return new Ok("The value has successfully taken back.");
    } else {
      return new Err(
        "Fail to take back. The object is not the owner of wrapped value."
      );
    }
  }

  /**
   * Unwrap the value as readonly object.
   */
  unwrap(): Readonly<T> {
    return this.value;
  }

  /**
   * Replaces the contained value with val, and returns the old contained value.
   */
  replace(value: T): Result<T, string> {
    if (this.isBorrowed()) {
      return new Err("Replace failed.");
    }

    this.borrowed = true;
    const oldValue = this.value;
    this.value = value;
    this.borrowed = false;

    return new Ok(oldValue);
  }

  /**
   * Replaces the wrapped value with a new one computed from function, returning the old value.
   */
  replaceWith(func: (value: T) => T): Result<T, string> {
    if (this.isBorrowed()) return new Err("Replace failed.");

    this.borrowed = true;
    const oldValue = this.value;
    const newValue = func(this.value);
    this.set(newValue);
    this.borrowed = false;

    return new Ok(oldValue);
  }

  /**
   * Swaps the values of two Cells.
   */
  swap(other: Cell<T>): Result<string, string> {
    if (this.isBorrowed() || other.isBorrowed()) {
      return new Err("Swap failed.");
    }
    this.borrowed = true;
    const tmp = this.value;
    this.set(other.value);
    other.set(tmp);
    this.borrowed = false;

    return new Ok("Swap successed.");
  }

  /**
   * Returns a clone of wrapped value.
   */
  clone(): Result<T, string> {
    if (this.isBorrowed()) return new Err("Clone failed.");

    return new Ok(clone(this.value));
  }

  // /**
  //  * Consume the wrapped value with consumer function.
  //  * While consumer proccessing, the value is marked as "borrowed".
  //  */
  // consume(consumer: (value: T, ...args: any[]) => any): Result<T, string> {
  //   if (this.isBorrowed()) return new Err("Consume failed.");

  //   this.borrowed = true;
  //   const value = consumer(this.value);
  //   this.borrowed = false;

  //   return new Ok(value);
  // }
}
