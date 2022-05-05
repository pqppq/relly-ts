import { Page } from "../src/buffer";
import { Cell } from "../src/utils/cell";
import { PAGE_SIZE, DiskManager } from "../src/disk";
import {
  MyBuffer,
  BufferId,
  BufferPool,
  BufferPoolManager,
} from "../src/buffer";

test("test createPage", (): void => {
  const disk = DiskManager.open("./tests/files/buffer.test");

  const pool = new BufferPool(1);
  const manager = new BufferPoolManager(disk, pool);

  const createResult = manager.createPage();

  expect(createResult.isOk()).toBe(true);
  if (createResult.isOk()) {
    expect(createResult.value.unwrap().pageId).toBe(0);
    expect(createResult.value.unwrap().isDirty).toBe(false);
  }
  const createResult2 = manager.createPage();
  expect(createResult2.isErr()).toBe(true);
});

test("test fetchPage", (): void => {
  const disk = DiskManager.open("./tests/files/buffer.test");

  const pool = new BufferPool(10);
  const manager = new BufferPoolManager(disk, pool);

  const createResult = manager.createPage();

  expect(createResult.isOk()).toBe(true);
  if (createResult.isOk()) {
    const obj = { "🦀": "🦐" };
    const borrowResult = createResult.value.borroweTo(obj);
    if (borrowResult.isOk()) {
      const buffer = borrowResult.value;
      const pageId = buffer.pageId;
      buffer.page.data.write("hello");

      const fetchResult = manager.fetchPage(pageId);
      expect(fetchResult.isOk()).toBe(true);
      if (fetchResult.isOk()) {
        expect(fetchResult.value.unwrap().page.data.toString()).toBe("hello");
      }
    }
    createResult.value.takeBackFrom(obj);
  }
});
