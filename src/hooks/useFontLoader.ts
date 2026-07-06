import { useCallback } from "react";
import { loadGoogleFont } from "../editor/googleFonts";

const STORAGE_KEY = "design-studio-fonts";

interface CustomFont {
  name: string;
  dataUrl: string;
}

export function useFontLoader() {
  const loadCustomFont = useCallback(async (file: File): Promise<CustomFont | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["ttf", "otf", "woff", "woff2"];
    if (!ext || !allowed.includes(ext)) {
      alert("Formato no soportado. Usa TTF, OTF, WOFF o WOFF2.");
      return null;
    }

    const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    const cf: CustomFont = { name, dataUrl };
    saveFont(cf);
    await injectFont(cf);
    return cf;
  }, []);

  const getFonts = useCallback((): CustomFont[] => {
    return loadFonts();
  }, []);

  const removeFont = useCallback((name: string) => {
    const fonts = loadFonts().filter((f) => f.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
    const style = document.getElementById(`font-${cssSafe(name)}`);
    if (style) style.remove();
  }, []);

  const injectAllFonts = useCallback(async () => {
    const fonts = loadFonts();
    for (const f of fonts) {
      await injectFont(f);
    }
  }, []);

  const loadFontFromUrl = useCallback(async (url: string): Promise<{ name: string } | null> => {
    try {
      // Google Fonts CSS URL: https://fonts.googleapis.com/css2?family=Font+Name:...
      if (url.includes("fonts.googleapis.com/css2")) {
        const params = new URLSearchParams(url.split("?")[1]);
        const familyParam = params.get("family");
        if (!familyParam) return null;
        const name = familyParam.replace(/\+/g, " ").split(":")[0].trim();
        loadGoogleFont(name);
        return { name };
      }

      // Direct font file URL (.ttf, .otf, .woff, .woff2)
      const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
      const allowed = ["ttf", "otf", "woff", "woff2"];
      if (ext && allowed.includes(ext)) {
        const name = url.split("/").pop()?.split("?")[0]?.replace(/\.[^.]+$/, "")?.replace(/[-_]/g, " ") || "Custom Font";
        const response = await fetch(url);
        if (!response.ok) throw new Error("No se pudo descargar la fuente");
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(blob);
        });
        const cf: CustomFont = { name, dataUrl };
        saveFont(cf);
        await injectFont(cf);
        return cf;
      }

      return null;
    } catch (err) {
      console.error("[loadFontFromUrl]", err);
      return null;
    }
  }, []);

  return { loadCustomFont, getFonts, removeFont, injectAllFonts, loadFontFromUrl };
}

export async function injectAllFontsStandalone() {
  const fonts = loadFonts();
  for (const f of fonts) {
    await injectFont(f);
  }
}

function loadFonts(): CustomFont[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveFont(font: CustomFont) {
  const fonts = loadFonts();
  const existing = fonts.findIndex((f) => f.name === font.name);
  if (existing >= 0) fonts[existing] = font;
  else fonts.push(font);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
}

function cssSafe(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, "-");
}

function injectFont(font: CustomFont): Promise<void> {
  return new Promise((resolve) => {
    const id = `font-${cssSafe(font.name)}`;
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const fontFace = new FontFace(font.name, `url(${font.dataUrl})`);
    fontFace.load().then(() => {
      document.fonts.add(fontFace);
      resolve();
    }).catch(() => resolve());
  });
}
