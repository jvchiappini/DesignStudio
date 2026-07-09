import type { DesignElement, Guide, Page } from "../../editor/utils/types";

/**
 * Single source of truth for ALL anchor resolution logic.
 *
 * Previously duplicated across 5 files (jsxParser, jsxApplicator, editorStore,
 * EditorCanvas, GuideOverlay), now centralised here.
 *
 * Usage:
 *   const svc = new AnchorService(guides, pages, pageGap);
 *   svc.resolveElement(el);        // set x/y/w/h from anchors
 *   svc.defaultOffsets(el);        // fill missing offsets with 0
 *   svc.offsetOnDrag(el, pageOff); // recalculate offsets after drag
 *   svc.onGuideMove(el, guideId, delta); // update el after guide moved
 *   svc.clearGuideRefs(el, guideId);     // remove anchors pointing to deleted guide
 */
export class AnchorService {
  guides: Guide[];
  pages: Page[];
  pageGap: number;

  constructor(guides: Guide[], pages: Page[], pageGap: number) {
    this.guides = guides;
    this.pages = pages;
    this.pageGap = pageGap;
  }

  // ── Public stateless helpers ──────────────────────────────────────────────

  /** Page offset in global canvas coordinates for a given page index */
  static pageOffset(pages: Page[], pageIndex: number, pageGap: number): number {
    let off = 0;
    for (let i = 0; i < pageIndex; i++) off += pages[i].width + pageGap;
    return off;
  }

  /** Resolve which page index a guide belongs to */
  static guidePageIndex(g: { pageNumber?: number }): number {
    return g.pageNumber !== undefined ? g.pageNumber - 1 : 0;
  }

  /** Compute page start for a guide */
  static guidePageStart(g: { pageNumber?: number }, pages: Page[], pageGap: number): number {
    return AnchorService.pageOffset(pages, AnchorService.guidePageIndex(g), pageGap);
  }

  // ── Pass 1: default missing offsets to 0 ──────────────────────────────────

  defaultOffsets(el: DesignElement): void {
    if (!el.leftAnchor && !el.rightAnchor && !el.topAnchor && !el.bottomAnchor) return;
    if (el.leftAnchor && el.leftAnchorOffset === undefined) el.leftAnchorOffset = 0;
    if (el.rightAnchor && el.rightAnchorOffset === undefined) el.rightAnchorOffset = 0;
    if (el.topAnchor && el.topAnchorOffset === undefined) el.topAnchorOffset = 0;
    if (el.bottomAnchor && el.bottomAnchorOffset === undefined) el.bottomAnchorOffset = 0;
  }

  // ── Pass 2: resolve x/y/w/h from anchors ──────────────────────────────────

  /**
   * Resolve an element's position/size from its anchors.
   * Mutates `el` in-place for performance (caller clones if needed).
   */
  resolveElement(el: DesignElement): void {
    this.resolveX(el);
    this.resolveY(el);
  }

  private resolveX(el: DesignElement): void {
    if (!el.leftAnchor && !el.rightAnchor) return;
    if (el.leftAnchor && el.leftAnchorOffset !== undefined) {
      const g = this.guides.find((gd) => gd.id === el.leftAnchor);
      if (g) el.x = g.position + AnchorService.guidePageStart(g, this.pages, this.pageGap) + el.leftAnchorOffset;
    }
    if (el.rightAnchor && el.rightAnchorOffset !== undefined) {
      const g = this.guides.find((gd) => gd.id === el.rightAnchor);
      if (g) {
        const ps = AnchorService.guidePageStart(g, this.pages, this.pageGap);
        const newRight = g.position + ps + el.rightAnchorOffset;
        if (el.leftAnchor) {
          el.width = Math.max(10, newRight - el.x);
        } else {
          el.x = newRight - el.width;
        }
      }
    }
  }

  private resolveY(el: DesignElement): void {
    if (!el.topAnchor && !el.bottomAnchor) return;
    if (el.topAnchor && el.topAnchorOffset !== undefined) {
      const g = this.guides.find((gd) => gd.id === el.topAnchor);
      if (g) el.y = g.position + AnchorService.guidePageStart(g, this.pages, this.pageGap) + el.topAnchorOffset;
    }
    if (el.bottomAnchor && el.bottomAnchorOffset !== undefined) {
      const g = this.guides.find((gd) => gd.id === el.bottomAnchor);
      if (g) {
        const ps = AnchorService.guidePageStart(g, this.pages, this.pageGap);
        const newBottom = g.position + ps + el.bottomAnchorOffset;
        if (el.topAnchor) {
          el.height = Math.max(10, newBottom - el.y);
        } else {
          el.y = newBottom - el.height;
        }
      }
    }
  }

  /** Resolve all elements in a batch */
  resolveAll(elements: DesignElement[]): DesignElement[] {
    return elements.map((el) => {
      const copy = { ...el };
      this.defaultOffsets(copy);
      this.resolveElement(copy);
      return copy;
    });
  }

  // ── Recalculate offset after user drags element ──────────────────────────

  /**
   * After an element is moved via drag on canvas, recalculate its anchor offsets
   * so it stays correctly positioned relative to its guides.
   * Returns a partial update object.
   */
  offsetOnDrag(el: DesignElement, pageOff: number): Partial<DesignElement> {
    const updates: Partial<DesignElement> = {};
    if (el.leftAnchor) {
      const g = this.guides.find((gd) => gd.id === el.leftAnchor);
      if (g) updates.leftAnchorOffset = el.x - (g.position + pageOff);
    }
    if (el.rightAnchor) {
      const g = this.guides.find((gd) => gd.id === el.rightAnchor);
      if (g) updates.rightAnchorOffset = el.x + el.width - (g.position + pageOff);
    }
    if (el.topAnchor) {
      const g = this.guides.find((gd) => gd.id === el.topAnchor);
      if (g) updates.topAnchorOffset = el.y - (g.position + pageOff);
    }
    if (el.bottomAnchor) {
      const g = this.guides.find((gd) => gd.id === el.bottomAnchor);
      if (g) updates.bottomAnchorOffset = el.y + el.height - (g.position + pageOff);
    }
    return updates;
  }

  // ── React to guide being moved ───────────────────────────────────────────

  /**
   * When a guide is moved by `delta` px, update the element's position/size.
   * Returns a partial update or null if no change needed.
   */
  onGuideMove(el: DesignElement, guideId: string, delta: number, guideOrientation: "horizontal" | "vertical"): Partial<DesignElement> | null {
    const hasLeft = el.leftAnchor === guideId;
    const hasRight = el.rightAnchor === guideId;
    const hasTop = el.topAnchor === guideId;
    const hasBottom = el.bottomAnchor === guideId;

    if (!hasLeft && !hasRight && !hasTop && !hasBottom) return null;

    const hasOtherLeft = !!el.leftAnchor && el.leftAnchor !== guideId;
    const hasOtherRight = !!el.rightAnchor && el.rightAnchor !== guideId;
    const hasOtherTop = !!el.topAnchor && el.topAnchor !== guideId;
    const hasOtherBottom = !!el.bottomAnchor && el.bottomAnchor !== guideId;

    // Y-axis: guide is horizontal, element has top/bottom
    if (guideOrientation === "horizontal" && (hasTop || hasBottom)) {
      const updates: Partial<DesignElement> = {};
      if (hasTop) {
        updates.y = el.y + delta;
        if (hasOtherBottom) updates.height = Math.max(10, el.height - delta);
      } else if (hasBottom) {
        if (hasOtherTop) updates.height = Math.max(10, el.height + delta);
        else updates.y = el.y + delta;
      }
      return updates;
    }

    // X-axis: guide is vertical, element has left/right
    const updates: Partial<DesignElement> = {};
    if (hasLeft) {
      updates.x = el.x + delta;
      if (hasOtherRight) updates.width = Math.max(10, el.width - delta);
    } else if (hasRight) {
      if (hasOtherLeft) updates.width = Math.max(10, el.width + delta);
      else updates.x = el.x + delta;
    }
    return updates;
  }

  // ── Clear references to a deleted guide ──────────────────────────────────

  /**
   * Remove any anchor references pointing to a guide ID being deleted.
   * Returns a partial update or null.
   */
  clearGuideRefs(el: DesignElement, guideId: string): Partial<DesignElement> | null {
    if (el.leftAnchor !== guideId && el.rightAnchor !== guideId &&
        el.topAnchor !== guideId && el.bottomAnchor !== guideId) return null;
    const updates: Partial<DesignElement> = {};
    if (el.leftAnchor === guideId) updates.leftAnchor = undefined;
    if (el.rightAnchor === guideId) updates.rightAnchor = undefined;
    if (el.topAnchor === guideId) updates.topAnchor = undefined;
    if (el.bottomAnchor === guideId) updates.bottomAnchor = undefined;
    return updates;
  }
}
