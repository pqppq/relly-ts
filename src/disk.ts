import * as fs from "node:fs";

export const PAGE_SIZE = 4096;

export type PageId = number;
export const INVALID_PAGE_ID = Number.MAX_SAFE_INTEGER;

export class DiskManager {
  private constructor(
    private heapFilePath: fs.PathLike,
    private nextPageId: number = 0
  ) {
    const heapFileSize = fs.statSync(this.heapFilePath).size;
    this.nextPageId = Math.ceil(heapFileSize / PAGE_SIZE);
  }

  static open(heapFilePath: fs.PathLike): DiskManager {
    return new DiskManager(heapFilePath);
  }

  readPageData(pageId: PageId, buffer: NodeJS.ArrayBufferView): void {
    const offset = PAGE_SIZE * pageId;

    const fd = fs.openSync(this.heapFilePath, "r");
    fs.readSync(fd, buffer, 0, buffer.byteLength, offset);
    fs.closeSync(fd);
  }

  writePageData(pageId: PageId, buffer: NodeJS.ArrayBufferView): void {
    const offset = PAGE_SIZE * pageId;

    const fd = fs.openSync(this.heapFilePath, "r+");
    fs.writeSync(fd, buffer, 0, buffer.byteLength, offset);
    fs.closeSync(fd);
  }

  allocatePage(): PageId {
    const pageId = this.nextPageId;
    this.nextPageId += 1;
    return pageId;
  }
}
