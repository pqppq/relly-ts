import * as fs from "node:fs";

export const PAGE_SIZE = 4096;

export type PageId = number;

export class DiskManager {
  private heapFilePath: fs.PathLike;
  private nextPageId: number;

  private constructor(heapFilePath: fs.PathLike) {
    this.heapFilePath = heapFilePath;

    const heapFileSize = fs.statSync(this.heapFilePath).size;
    this.nextPageId = Math.ceil(heapFileSize / PAGE_SIZE);
  }

  static open(heapFilePath: fs.PathLike): DiskManager {
    return new DiskManager(heapFilePath);
  }

  readPageData(pageId: PageId, buffer: Buffer): void {
    const offset = PAGE_SIZE * pageId;

    const fd = fs.openSync(this.heapFilePath, "r");
    fs.readSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);
  }

  writePageData(pageId: PageId, buffer: Buffer): void {
    const offset = PAGE_SIZE * pageId;

    const fd = fs.openSync(this.heapFilePath, "w");
    fs.writeSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);
  }

  allocatePage(): PageId {
    const pageId = this.nextPageId;
    this.nextPageId += 1;
    return pageId;
  }
}
