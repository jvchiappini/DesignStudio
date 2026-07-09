import type { DesignElement, ElementType } from "../../editor/utils/types";

/** Context passed to parse() methods */
export interface ParseContext {
  el: Element;
  startX: number;
  elementCount: number;
}

/** Context passed to serialize() methods */
export interface SerializeContext {
  rx: number;
  llmMode: boolean;
}

/** Result of render() */
export interface RenderResult {
  style: Record<string, unknown>;
  content: React.ReactNode;
}

/** Attribute type classification for validation */
export interface AttrSchema {
  /** Attribute names that expect numeric values */
  numeric: ReadonlySet<string>;
  /** Attribute names that expect boolean values */
  boolean: ReadonlySet<string>;
  /** Attribute names with a fixed set of valid string values */
  enums: Readonly<Record<string, ReadonlySet<string>>>;
  /** Attribute names that expect arbitrary string values */
  strings: ReadonlySet<string>;
}

/**
 * Strategy interface for each element type.
 *
 * Each element type encapsulates ALL its logic: parsing, serializing,
 * rendering, validation, defaults, and attribute metadata.
 */
export interface ElementBehavior<T extends DesignElement = DesignElement> {
  type: ElementType;

  /** Attribute schema for validation (used by applyPatchTool) */
  attrSchema: AttrSchema;

  /** Parse from DOM element to DesignElement */
  parse(ctx: ParseContext, id: string): T;

  /** Serialize DesignElement to JSX string */
  serialize(el: T, ctx: SerializeContext): string;

  /** Render to React CSSProperties + content */
  render(el: T): RenderResult;

  /** Validate element properties */
  validate(el: T): Array<{ field: string; message: string }>;

  /** Create an element with sensible defaults */
  createDefault(overrides?: Partial<T>): T;
}
