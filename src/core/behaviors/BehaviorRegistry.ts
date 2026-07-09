import type { ElementType, DesignElement } from "../../editor/utils/types";
import type { ElementBehavior, ParseContext, SerializeContext } from "./ElementBehavior";
import { TextBehavior } from "./TextBehavior";
import { ImageBehavior } from "./ImageBehavior";
import { ShapeBehavior } from "./ShapeBehavior";
import { SvgBehavior } from "./SvgBehavior";

const behaviors: ElementBehavior[] = [
  TextBehavior,
  ImageBehavior,
  ShapeBehavior,
  SvgBehavior,
];

const behaviorByType = new Map<ElementType, ElementBehavior>(
  behaviors.map((b) => [b.type, b])
);

export function getBehavior(type: ElementType): ElementBehavior {
  const b = behaviorByType.get(type);
  if (!b) throw new Error(`No behavior registered for element type "${type}"`);
  return b;
}

export function getAllTypes(): ElementType[] {
  return behaviors.map((b) => b.type);
}

/** Aggregate all numeric attrs across all behaviors */
export function getAllNumericAttrs(): Set<string> {
  const all = new Set<string>();
  for (const b of behaviors) for (const a of b.attrSchema.numeric) all.add(a);
  return all;
}

/** Aggregate all boolean attrs across all behaviors */
export function getAllBooleanAttrs(): Set<string> {
  const all = new Set<string>();
  for (const b of behaviors) for (const a of b.attrSchema.boolean) all.add(a);
  return all;
}

/** Aggregate all enum values for a given key across all behaviors */
export function getEnumValues(key: string): ReadonlySet<string> | undefined {
  for (const b of behaviors) {
    const vals = b.attrSchema.enums[key];
    if (vals) return vals;
  }
  return undefined;
}

/** Get all enum keys across all behaviors */
export function getAllEnumKeys(): Set<string> {
  const keys = new Set<string>();
  for (const b of behaviors) for (const k of Object.keys(b.attrSchema.enums)) keys.add(k);
  return keys;
}

/** Check if an attribute is valid for a specific element type */
export function isValidAttr(type: ElementType, key: string): boolean {
  const b = behaviorByType.get(type);
  if (!b) return false;
  const { numeric, boolean: boolSet, enums } = b.attrSchema;
  return numeric.has(key) || boolSet.has(key) || key in enums;
}

/** Validate a single attribute value, returning parsed value or error */
export function validateAttr(
  type: ElementType, key: string, val: string,
  tagName?: string,
): { valid: true; value: unknown } | { valid: false; error: string } {
  const b = behaviorByType.get(type);
  if (!b) return { valid: false, error: `Unknown element type "${type}"` };

  const { numeric, boolean: boolSet, enums } = b.attrSchema;
  const tag = tagName ?? type;

  if (val === "" && numeric.has(key)) {
    return { valid: false, error: `attribute "${key}" in <${tag}> has empty value` };
  }

  if (numeric.has(key)) {
    const n = parseFloat(val);
    if (isNaN(n)) return { valid: false, error: `attribute "${key}"="${val}" in <${tag}> is not a valid number` };
    if (key === "opacity" && (n < 0 || n > 1)) return { valid: false, error: `opacity must be between 0 and 1, got ${n}` };
    if ((key === "w" || key === "width" || key === "h" || key === "height" || key === "fontSize") && n <= 0) {
      return { valid: false, error: `"${key}" must be > 0, got ${n}` };
    }
    return { valid: true, value: n };
  }

  if (boolSet.has(key)) {
    if (val !== "true" && val !== "false") {
      return { valid: false, error: `attribute "${key}"="${val}" in <${tag}> must be "true" or "false"` };
    }
    return { valid: true, value: val === "true" };
  }

  if (key in enums) {
    const values = enums[key];
    if (!values.has(val)) {
      return { valid: false, error: `"${key}" must be one of: ${[...values].join(", ")}, got "${val}"` };
    }
    return { valid: true, value: val };
  }

  // String attrs — always valid
  return { valid: true, value: val };
}

/** Parse a DOM element into a DesignElement using the right behavior */
export function parseElement(el: Element, startX: number, elementCount: number, id: string): DesignElement | null {
  const tag = el.tagName.toLowerCase();
  let type: ElementType;

  if (tag === "text") type = "text";
  else if (tag === "image") type = "image";
  else if (tag === "shape" || tag === "figure") type = "shape";
  else if (tag === "svg") type = "svg";
  else return null;

  const ctx: ParseContext = { el, startX, elementCount };
  return getBehavior(type).parse(ctx, id);
}

/** Serialize an element using its behavior */
export function serializeElement(el: DesignElement, rx: number, llmMode: boolean): string {
  const ctx: SerializeContext = { rx, llmMode };
  return getBehavior(el.type).serialize(el, ctx);
}
