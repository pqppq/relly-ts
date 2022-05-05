import { PAGE_SIZE, PageId, INVALID_PAGE_ID, DiskManager } from "./disk";
import { Cell } from "./utils/cell";
import { Result, Ok, Err } from "./utils/result";
import clone from "clone";

export class Page {
  constructor(public data: Buffer = new Buffer(PAGE_SIZE)) {}
}

export type BufferId = number;

export type MyBuffer = {
  pageId: PageId;
  page: Page;
  isDirty: boolean;
};

export type Frame = {
  usageCount: number;
  buffer: Cell<MyBuffer>;
};

export class BufferPool {
  readonly poolSize: number;
  buffers: Frame[];
  nextVictimId: BufferId;

  constructor(poolSize: number) {
    this.poolSize = poolSize;
    this.nextVictimId = 0;
    this.buffers = [];

    const defaultFrame: Frame = {
      usageCount: 0,
      buffer: new Cell({
        pageId: INVALID_PAGE_ID,
        page: new Page(),
        isDirty: false,
      }),
    };

    // initialize buffers by default value
    for (let i = 0; i < poolSize; i++) {
      this.buffers.push(clone(defaultFrame));
    }
  }

  evict(): Result<BufferId, string> {
    let consecutivePinned = 0;
    let victimId: BufferId = this.nextVictimId;

    for (const [index, frame] of this.buffers.entries()) {
      if (frame.usageCount === 0) {
        victimId = index;
        break;
      }
      if (frame.buffer.isBorrowed()) {
        consecutivePinned += 1;
        if (consecutivePinned >= this.poolSize) {
          return new Err("No buffer to evict.");
        } else {
          frame.usageCount -= 1;
          consecutivePinned = 0;
        }
        this.nextVictimId = this.incrementId(victimId);
      }
    }
    return new Ok(victimId);
  }

  incrementId(bufferId: BufferId): BufferId {
    return (bufferId + 1) % this.poolSize;
  }

  getFrame(bufferId: BufferId): Frame {
    return this.buffers[bufferId];
  }
  setFrame(bufferId: BufferId, frame: Frame): void {
    this.buffers[bufferId] = frame;
  }
}

export class BufferPoolManager {
  public pageTable: Map<PageId, BufferId> = new Map();
  constructor(public disk: DiskManager, public pool: BufferPool) {}

  fetchPage(pageId: PageId): Result<Cell<MyBuffer>, string> {
    let bufferId = this.pageTable.get(pageId);
    if (bufferId) {
      const frame = this.pool.getFrame(bufferId);
      frame.usageCount += 1;
      return new Ok(clone(frame.buffer));
    }

    const evictResult = this.pool.evict();
    if (evictResult.isErr()) {
      return new Err(evictResult.value);
    }

    bufferId = evictResult.value;
    const frame = this.pool.getFrame(bufferId);
    const bufCell = frame.buffer;
    const buffer = bufCell.unwrap();
    const evictPageId = buffer.pageId;

    if (bufCell.unwrap().isDirty) {
      // write page data into disk
      this.disk.writePageData(evictPageId, buffer.page.data);
    }
    const cloneResult = bufCell.clone();
    if (cloneResult.isErr()) {
      return new Err(`Fail to fetch page. pageId=${pageId}`);
    }
    const clonedBuf = cloneResult.value;
    // read data
    this.disk.readPageData(pageId, clonedBuf.page.data);
    clonedBuf.pageId = pageId;
    clonedBuf.isDirty = false;

    frame.usageCount += 1;
    frame.buffer = new Cell(clonedBuf);

    this.pageTable.delete(evictPageId);
    this.pageTable.set(pageId, bufferId);

    const page = clone(frame.buffer);

    return new Ok(page);
  }

  createPage(): Result<Cell<MyBuffer>, string> {
    const evictResult = this.pool.evict();
    if (evictResult.isErr()) {
      return new Err("Fail to create page.");
    }

    const bufferId = evictResult.value;
    const frame = this.pool.getFrame(bufferId);
    const buffer = frame.buffer.unwrap();
    const evictPageId = buffer.pageId;

    if (buffer.isDirty) {
      this.disk.writePageData(evictPageId, buffer.page.data);
    }

    const pageId = this.disk.allocatePage();
    frame.usageCount = 1;
    frame.buffer = new Cell({
      pageId,
      page: new Page(),
      isDirty: false,
    });

    this.pageTable.delete(evictPageId);
    this.pageTable.set(pageId, bufferId);

    return new Ok(clone(frame.buffer));
  }

  flush(): Result<string, string> {
    for (const [pageId, bufferId] of this.pageTable.entries()) {
      const frame = this.pool.getFrame(bufferId);
      const cloneResult = frame.buffer.clone();
      if (cloneResult.isErr()) {
        return new Err("Fail to flush data.");
      }
      const buffer = cloneResult.value;
      this.disk.writePageData(pageId, buffer.page.data);

      // initialize page
      buffer.pageId = pageId;
      buffer.page = new Page();
      buffer.isDirty = false;

      frame.buffer = new Cell(buffer);
    }
    return new Ok("Success to flush data.");
  }
}
