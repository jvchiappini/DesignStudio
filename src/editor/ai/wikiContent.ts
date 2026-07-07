/**
 * wikiContent.ts
 *
 * Pre-loads all wiki markdown files at build time using Vite's import.meta.glob
 * so the AI agent can read granular sections via read_wiki tool.
 */

const wikiModules = import.meta.glob("/wiki/**/*.md", { query: "?raw", eager: true, import: "default" }) as Record<string, string>;
const iaWikiModules = import.meta.glob("/ia_wiki/**/*.md", { query: "?raw", eager: true, import: "default" }) as Record<string, string>;

const allModules = { ...wikiModules, ...iaWikiModules };

const HEADING_RE = /^(#{2,4})\s+(.+)$/;

interface WikiSection {
  level: number;
  heading: string;
  content: string;
  slug: string;
}

export function getWikiFile(path: string): string | null {
  const key = Object.keys(allModules).find(
    (k) => k.toLowerCase() === path.toLowerCase() || k.endsWith(`/${path.toLowerCase()}.md`)
  );
  if (key) return allModules[key] as string;
  return null;
}

/** Split a wiki file into heading-delimited sections (##, ###, ####). */
function parseSections(markdown: string): WikiSection[] {
  const lines = markdown.split("\n");
  const sections: WikiSection[] = [];
  let current: WikiSection | null = null;

  for (const line of lines) {
    const m = line.match(HEADING_RE);
    if (m) {
      if (current) sections.push(current);
      const heading = m[2].trim();
      current = {
        level: m[1].length,
        heading,
        content: line,
        slug: heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      };
    } else if (current) {
      current.content += "\n" + line;
    }
  }
  if (current) sections.push(current);
  return sections;
}

/** List all section slugs and headings in a wiki file. */
export function listWikiSections(path: string): { slug: string; heading: string; level: number }[] | null {
  const full = getWikiFile(path);
  if (!full) return null;
  return parseSections(full).map((s) => ({ slug: s.slug, heading: s.heading, level: s.level }));
}

/**
 * Get a specific section from a wiki file by slug (e.g. "tipos-de-capa", "multiple-shadows").
 * Returns only that section's content (max ~200 lines to avoid context overflow).
 */
export function getWikiSection(path: string, slug: string): string | null {
  const full = getWikiFile(path);
  if (!full) return null;
  const sections = parseSections(full);
  const found = sections.find((s) => s.slug === slug || s.heading.toLowerCase() === slug.toLowerCase());
  if (!found) return null;
  const lines = found.content.split("\n");
  const clipped = lines.length > 200 ? lines.slice(0, 200).join("\n") + "\n\n_...(truncated at 200 lines)_" : found.content;
  return clipped;
}

export function listWikiFiles(): string[] {
  const human = Object.keys(wikiModules).map((k) => k.replace(/^\/wiki\/elements\//, "").replace(/\.md$/, ""));
  const ia = Object.keys(iaWikiModules).map((k) => k.replace(/^\/ia_wiki\//, "").replace(/\.md$/, ""));
  return [...human, ...ia];
}
