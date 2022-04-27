import * as fs from "node:fs";

const PAGE_SIZE = 4096;

export class DiskManager {
  private heapFile: File;
  private nextPageId: number;

  constructor(heapFilePath: fs.PathLike) {
    this.heapFile = new File(heapFilePath);
    const heapFileSize = this.heapFile.size();
    this.nextPageId = heapFileSize / PAGE_SIZE;
  }

  open(heapFilePath: fs.PathLike): DiskManager {
    return new DiskManager(heapFilePath);
  }
}

export class File {
  private fd: number;

  constructor(heapFilePath: fs.PathLike) {
    this.fd = fs.openSync(heapFilePath, "w+");
  }

  size(): number {
    return fs.fstatSync(this.fd).size;
  }
}

export class PageId {
  static INVALID_PAGE_ID = Number.MAX_VALUE;
}
