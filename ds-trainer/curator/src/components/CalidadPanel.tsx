import { useRef } from "react";
import type { DesignEntry } from "../types";
import { useCurationStore } from "../store/curationStore";

// ─── All quality items (used for training conditioning) ───────────────────────

export interface TrainingAttr {
  key: string;
  label: string;
  icon: string;
  group: string;
  /** What this attribute teaches the model about apply_project */
  hint: string;
}

export const TRAINING_ATTRIBUTES: TrainingAttr[] = [
  // Page structure
  { key: "multi-page", label: "Multipágina", icon: "📄", group: "Estructura", hint: "Estructura con <page> y navegación entre páginas" },
  { key: "single-page", label: "Una página", icon: "📃", group: "Estructura", hint: "Diseño completo en una sola página" },
  { key: "has-config", label: "Con <config>", icon: "⚙️", group: "Estructura", hint: "Configuración global con pageGap, grid, guías" },

  // Visual style
  { key: "dark-mode", label: "Dark mode", icon: "🌙", group: "Estilo visual", hint: "Fondos oscuros (#1a1a2e, #0f0f1a)" },
  { key: "light-mode", label: "Light mode", icon: "☀️", group: "Estilo visual", hint: "Fondos claros y alto contraste" },
  { key: "editorial", label: "Editorial", icon: "📰", group: "Estilo visual", hint: "Maquetación tipo revista con columnas y jerarquía" },
  { key: "minimal", label: "Minimalista", icon: "◇", group: "Estilo visual", hint: "Espacio negativo, tipografía limpia, pocos elementos" },
  { key: "elegant", label: "Elegante", icon: "✦", group: "Estilo visual", hint: "Paleta refinada, detalles sutiles, tipografía serif" },

  // Layout
  { key: "complex-layout", label: "Layout complejo", icon: "🏗️", group: "Layout", hint: "Múltiples zonas, elementos superpuestos, composición no trivial" },
  { key: "good-grid", label: "Buena cuadrícula", icon: "🔲", group: "Layout", hint: "Alineación a guías, espaciado consistente" },
  { key: "well-structured", label: "Bien estructurado", icon: "📋", group: "Layout", hint: "Secciones claras, jerarquía de contenidos" },
  { key: "asymmetric", label: "Asimétrico", icon: "🔀", group: "Layout", hint: "Composición asimétrica interesante" },

  // Typography
  { key: "good-typography", label: "Buena tipografía", icon: "🔤", group: "Tipografía", hint: "Selección de fuentes, tamaños, pesos y espaciado" },
  { key: "bold-typography", label: "Tipografía bold", icon: "🅱️", group: "Tipografía", hint: "Títulos grandes y llamativos, contraste tipográfico" },
  { key: "good-hierarchy", label: "Jerarquía clara", icon: "📐", group: "Tipografía", hint: "Títulos, subtítulos, cuerpo — escala tipográfica" },
  { key: "readable", label: "Legible", icon: "👁️", group: "Tipografía", hint: "Cuerpo de texto legible, interlineado, ancho de columna" },

  // Color
  { key: "good-colors", label: "Buen color", icon: "🎨", group: "Color", hint: "Paleta coherente, colores complementarios" },
  { key: "high-contrast", label: "Alto contraste", icon: "◐", group: "Color", hint: "Contraste suficiente entre texto y fondo" },
  { key: "harmonious-palette", label: "Paleta armónica", icon: "🌈", group: "Color", hint: "Colores que funcionan juntos visualmente" },
  { key: "gradient-use", label: "Usa gradientes", icon: "🌀", group: "Color", hint: "Degradados en fondos o elementos" },

  // Content
  { key: "well-written", label: "Buen copy", icon: "✍️", group: "Contenido", hint: "Texto coherente, bien escrito y con propósito" },
  { key: "good-images", label: "Buenas imágenes", icon: "🖼️", group: "Contenido", hint: "Imágenes de alta calidad, bien integradas" },
  { key: "icon-use", label: "Usa iconos", icon: "🔣", group: "Contenido", hint: "Iconos decorativos o funcionales en el diseño" },
  { key: "consistent", label: "Consistente", icon: "♻️", group: "Contenido", hint: "Estilo homogéneo en todas las páginas" },
];

const ATTR_MAP = new Map(TRAINING_ATTRIBUTES.map((a) => [a.key, a]));

// Group attributes for display
const GROUPS = TRAINING_ATTRIBUTES.reduce<{ label: string; items: TrainingAttr[] }[]>((acc, attr) => {
  let g = acc.find((g) => g.label === attr.group);
  if (!g) { g = { label: attr.group, items: [] }; acc.push(g); }
  g.items.push(attr);
  return acc;
}, []);

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  entry: DesignEntry;
}

export function TrainingPanel({ entry }: Props) {
  const {
    addTag, removeTag,
    isAddingTag, pendingTag, setIsAddingTag, setPendingTag,
  } = useCurationStore();
  const tagInputRef = useRef<HTMLInputElement>(null);

  const activeTags = entry.curation.tags;

  function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pendingTag.trim()) {
      addTag(entry.id, pendingTag.trim());
      setPendingTag("");
    }
    setIsAddingTag(false);
  }

  // Separate attributes into active/inactive training attrs + custom tags
  const activeTraining = activeTags.filter((t) => ATTR_MAP.has(t));
  const customTags = activeTags.filter((t) => !ATTR_MAP.has(t));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(0,210,255,0.1)",
        background: "rgba(0,210,255,0.04)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13 }}>🎯</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#00d2ff", fontFamily: "Inter, sans-serif" }}>
            Training · apply_project
          </span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif" }}>
          Atributos de entrenamiento para generar JSX completo
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* Prompt */}
        <div style={{ marginBottom: 16, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>
            Prompt de entrenamiento
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}>
            {entry.prompt}
          </div>
        </div>

        {/* Attribute groups with toggles */}
        {GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase", letterSpacing: 1,
              marginBottom: 6, fontFamily: "Inter, sans-serif",
            }}>
              {group.label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {group.items.map((attr) => {
                const active = activeTags.includes(attr.key);
                return (
                  <button
                    key={attr.key}
                    onClick={() => (active ? removeTag : addTag)(entry.id, attr.key)}
                    title={attr.hint}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: `1.5px solid ${active ? "#00d2ff" : "rgba(255,255,255,0.08)"}`,
                      background: active ? "rgba(0,210,255,0.1)" : "rgba(255,255,255,0.02)",
                      color: active ? "#00d2ff" : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      fontSize: 10.5,
                      fontFamily: "Inter, sans-serif",
                      transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontSize: 11 }}>{attr.icon}</span>
                    <span>{attr.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Active attributes summary */}
        {activeTraining.length > 0 && (
          <div style={{
            marginBottom: 14, padding: 10, borderRadius: 8,
            background: "rgba(0,210,255,0.04)",
            border: "1px solid rgba(0,210,255,0.1)",
          }}>
            <div style={{
              fontSize: 10, color: "rgba(0,210,255,0.5)",
              textTransform: "uppercase", letterSpacing: 1,
              marginBottom: 6, fontFamily: "Inter, sans-serif",
            }}>
              Atributos activos ({activeTraining.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {activeTraining.map((key) => {
                const attr = ATTR_MAP.get(key)!;
                return (
                  <span key={key} style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "2px 6px 2px 8px", borderRadius: 12,
                    background: "rgba(0,210,255,0.1)",
                    border: "1px solid rgba(0,210,255,0.2)",
                    fontSize: 10, color: "#00d2ff",
                    fontFamily: "Inter, sans-serif",
                  }}>
                    {attr.icon} {attr.label}
                    <button onClick={() => removeTag(entry.id, key)} style={{
                      background: "none", border: "none",
                      color: "rgba(0,210,255,0.4)",
                      cursor: "pointer", fontSize: 10, lineHeight: 1, padding: 0,
                    }}>×</button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom tags */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase", letterSpacing: 1,
            marginBottom: 6, fontFamily: "Inter, sans-serif",
          }}>
            Etiquetas adicionales {customTags.length > 0 && `(${customTags.length})`}
          </div>

          {customTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {customTags.map((tag) => (
                <span key={tag} style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 6px 2px 8px", borderRadius: 12,
                  background: "rgba(108,92,231,0.12)",
                  border: "1px solid rgba(108,92,231,0.25)",
                  fontSize: 10, color: "#a29bfe",
                  fontFamily: "Inter, sans-serif",
                }}>
                  {tag}
                  <button onClick={() => removeTag(entry.id, tag)} style={{
                    background: "none", border: "none",
                    color: "rgba(162,155,254,0.4)",
                    cursor: "pointer", fontSize: 10, lineHeight: 1, padding: 0,
                  }}>×</button>
                </span>
              ))}
            </div>
          )}

          {isAddingTag ? (
            <form onSubmit={handleTagSubmit} style={{ display: "flex" }}>
              <input
                ref={tagInputRef}
                autoFocus
                value={pendingTag}
                onChange={(e) => setPendingTag(e.target.value)}
                onBlur={() => { setIsAddingTag(false); setPendingTag(""); }}
                onKeyDown={(e) => e.key === "Escape" && setIsAddingTag(false)}
                placeholder="etiqueta..."
                style={{
                  flex: 1, padding: "5px 10px", borderRadius: 8,
                  border: "1px solid rgba(108,92,231,0.5)",
                  background: "rgba(108,92,231,0.08)",
                  color: "#a29bfe", fontSize: 11, outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </form>
          ) : (
            <button onClick={() => setIsAddingTag(true)} style={{
              padding: "4px 10px", borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              border: "1px dashed rgba(255,255,255,0.12)",
              fontSize: 10, color: "rgba(255,255,255,0.35)",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              + Añadir etiqueta custom
            </button>
          )}
        </div>
      </div>

      {/* Footer with tool description */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}>
          Los atributos activos se usan como condiciones de entrenamiento para <code style={{ color: "rgba(0,210,255,0.5)" }}>apply_project</code>.
          El modelo aprende a generar JSX que cumpla estas características dado un prompt.
        </div>
      </div>
    </div>
  );
}
