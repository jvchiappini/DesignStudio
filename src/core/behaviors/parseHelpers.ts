import type { ClipMask } from "../../editor/utils/types";

export function numAttr(el: Element, attr: string, def = 0): number {
  const v = el.getAttribute(attr);
  return v !== null && v !== "" ? parseFloat(v) : def;
}

export function strAttr<T extends string>(el: Element, attr: string): T | undefined {
  const v = el.getAttribute(attr);
  return (v !== null && v !== "" ? v : undefined) as T | undefined;
}

export function boolAttr(el: Element, attr: string, def: boolean): boolean {
  const v = el.getAttribute(attr);
  return v !== null ? v === "true" : def;
}

export function hasAttr(el: Element, attr: string): boolean {
  return el.getAttribute(attr) !== null && el.getAttribute(attr) !== "";
}

export function parseClipMask(raw: string | null | undefined): ClipMask | undefined {
  if (!raw) return undefined;
  const idx = raw.indexOf(":");
  if (idx === -1) return undefined;
  return { type: raw.slice(0, idx) as ClipMask["type"], value: raw.slice(idx + 1) };
}

/** Quote a value for XML attribute */
export function q(v: unknown): string {
  return `"${String(v).replace(/"/g, "&quot;")}"`;
}

/** Emit ` key="value"` only when non-null and non-default */
export function a(k: string, v: unknown, def?: unknown): string {
  return v !== undefined && v !== null && v !== def ? ` ${k}=${q(v)}` : "";
}

/** Emit boolean attr only when non-default */
export function ab(k: string, v: unknown, def: boolean): string {
  return v !== undefined && v !== null && v !== def ? ` ${k}=${q(v)}` : "";
}
