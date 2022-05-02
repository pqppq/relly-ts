import { DiskManager, PAGE_SIZE } from "../src/disk";

test("disk read/write", (): void => {
  const disk = DiskManager.open("./tests/files/test");

  const hello = Buffer.from("Hello");
  const world = Buffer.from("World");

  const p1 = disk.allocatePage();
  const p2 = disk.allocatePage();

  disk.writePageData(p1, hello);
  disk.writePageData(p2, world);

  const buffer1 = Buffer.alloc(PAGE_SIZE);
  disk.readPageData(p1, buffer1);

  const buffer2 = Buffer.alloc(PAGE_SIZE);
  disk.readPageData(p2, buffer2);

  expect(new TextDecoder().decode(buffer1)).toMatch("Hello");
  expect(new TextDecoder().decode(buffer2)).toMatch("World");

  const mask = Buffer.from("@@");
  disk.writePageData(p1, mask);
  const buffer3 = Buffer.alloc(PAGE_SIZE);
  disk.readPageData(p1, buffer3);
  expect(new TextDecoder().decode(buffer3)).toMatch("@@llo");
});
