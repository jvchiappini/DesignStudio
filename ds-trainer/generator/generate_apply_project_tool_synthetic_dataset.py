"""
generate_dataset.py
Generador de datos sintéticos de GRADO ÉLITE para agentes de diseño.
Cumple estrictamente con las reglas de 4 anchors, autoFitSize y cero uso de x/y en textos.
Incluye razonamiento (Chain of Thought), Tool Noise y System Prompt Dropout.

Ejecución: python generate_dataset.py
"""

import json
import random
import re
from pathlib import Path

# ==========================================
# 1. HERRAMIENTAS (TOOL SCHEMAS)
# ==========================================
APPLY_PROJECT_TOOL = {
    "type": "function",
    "function": {
        "name": "apply_project",
        "description": "Reemplaza TODO el proyecto con un nuevo diseño JSX. Usar para peticiones de diseños nuevos.",
        "parameters": {
            "type": "object",
            "properties": {
                "jsx": {
                    "type": "string",
                    "description": "El string JSX completo con <project>, <config> y <page>."
                }
            },
            "required": ["jsx"]
        }
    }
}

APPLY_PATCH_TOOL = {
    "type": "function",
    "function": {
        "name": "apply_patch",
        "description": "Aplica cambios incrementales a un diseño existente. NO usar para diseños nuevos.",
        "parameters": {
            "type": "object",
            "properties": {"patch": {"type": "string"}},
            "required": ["patch"]
        }
    }
}

GET_CANVAS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_canvas_state",
        "description": "Obtiene el estado actual del lienzo. Usar para diagnosticar.",
        "parameters": {"type": "object", "properties": {}}
    }
}

# ==========================================
# 2. SYSTEM PROMPT BASE (PLACEHOLDER)
# ==========================================
DS_SYSTEM_PROMPT = """Eres Design Studio AI — un AGENTE AUTÓNOMO experto en diseño y generación de código para el editor Design Studio.

### Reglas de autonomía:
1. NO PREGUNTES al usuario qué hacer. Tú decides, razonas y ejecutas.
2. USA LAS HERRAMIENTAS disponibles para lograr el objetivo en formato JSON.

### Arquitectura de razonamiento
Antes de llamar a una herramienta, debes escribir tu proceso lógico dentro de etiquetas <thought>...</thought>. 
Analiza el pedido, planifica la estructura de guías, y verifica mentalmente las reglas.

### Reglas JSX y Mandatos (LEY ABSOLUTA):
1. MANDATO DE GUÍAS: Toda página debe tener guías explícitas <guide> en <config>. ¡Las guías de cada página deben llevar el atributo pageNumber="N" y sus IDs deben empezar con pN- (ej. p1-margen)!
2. MANDATO DE AUTOFIT: Usa autoFitSize="true" en TODOS los textos.
3. MANDATO DE ANCHORS: NUNCA uses 'x', 'y', 'w', 'h' en elementos <text>. CADA texto debe tener OBLIGATORIAMENTE: leftAnchor, rightAnchor, topAnchor y bottomAnchor.
4. MÚLTIPLES PÁGINAS: Si piden N páginas, genera N tags <page> dentro del mismo <project>.

Fallas en seguir estas reglas resultarán en la ruptura del sistema."""

# ==========================================
# 3. VOCABULARIO Y CONFIGURACIÓN DE DISEÑO
# ==========================================
ARCHETYPES = ["magazine_cover", "poster", "editorial_spread", "newsletter", "lookbook", "brand_guidelines"]

COLOR_SCHEMES = [
    {"name": "dark_violet", "bg": "#0f0f1a", "accent": "#6c5ce7", "text": "#ffffff", "muted": "#a0a0b0"},
    {"name": "light_clean", "bg": "#f8f9fa", "accent": "#2d3748", "text": "#1a1a2e", "muted": "#666676"},
    {"name": "acid_lime",   "bg": "#0b0f0a", "accent": "#c6ff00", "text": "#f2fff0", "muted": "#7fae5f"},
    {"name": "clay_neutral","bg": "#efe7dd", "accent": "#8a5a44", "text": "#2a221c", "muted": "#8c8177"},
    {"name": "cyber_blue",  "bg": "#050b14", "accent": "#00f0ff", "text": "#e0f8ff", "muted": "#4a7a8c"},
    {"name": "warm_terra",  "bg": "#fff8f0", "accent": "#c0392b", "text": "#2c2c2c", "muted": "#888888"}
]

FONT_PAIRINGS = [
    {"name": "playfair_inter", "display": "Playfair Display, serif", "body": "Inter, sans-serif"},
    {"name": "oswald_inter", "display": "Oswald, sans-serif", "body": "Inter, sans-serif"},
    {"name": "syne_ibm", "display": "Syne, sans-serif", "body": "IBM Plex Sans, sans-serif"},
    {"name": "archivo_dm", "display": "Archivo Black, sans-serif", "body": "DM Sans, sans-serif"}
]

PAGE_SIZES = {
    "A4": (2480, 3508), "Landscape_A4": (3508, 2480), "Tabloid": (4960, 3508),
    "Story": (1080, 1920), "Square": (1080, 1080), "Poster": (1920, 2880)
}

TOPIC_VOCAB = {
    "diseño editorial": ["la retícula", "el ritmo visual", "la maquetación"],
    "inteligencia artificial": ["el algoritmo", "el modelo generativo", "la red neuronal"],
    "moda urbana": ["el streetwear", "la silueta", "el textil técnico"],
    "arquitectura minimalista": ["el volumen puro", "la luz natural", "el espacio negativo"],
    "cultura digital": ["la comunidad", "la identidad descentralizada", "el medio interactivo"]
}
TOPICS = list(TOPIC_VOCAB.keys())

def generate_text_content(rng, topic, type="body", is_heavy=False):
    concepts = TOPIC_VOCAB[topic]
    if type == "title":
        return f"EL FUTURO DE {rng.choice(concepts).upper()}"
    elif type == "subtitle":
        return f"Explorando {rng.choice(concepts)} en el siglo XXI"
    else: # body
        n_sentences = rng.randint(5, 10) if is_heavy else rng.randint(2, 4)
        sentences = []
        for _ in range(n_sentences):
            c1, c2 = rng.sample(concepts, 2)
            sentences.append(f"La interacción entre {c1} y {c2} redefine nuestros estándares actuales.")
        return " ".join(sentences)

# ==========================================
# 4. CONSTRUCTORES DE JSX (ESTRICTOS)
# ==========================================
def build_guides(rng, pg_i, margin, W, H, n_cols):
    guides = []
    # --- GUÍAS VERTICALES ---
    guides.append(f'    <guide id="p{pg_i}-ml" position="{margin}" orientation="vertical" pageNumber="{pg_i}" />')
    guides.append(f'    <guide id="p{pg_i}-mr" position="{W - margin}" orientation="vertical" pageNumber="{pg_i}" />')
    
    gutter = rng.choice([40, 60, 100])
    if n_cols > 1:
        cw = (W - 2*margin - (gutter * (n_cols-1))) // n_cols
        for i in range(1, n_cols):
            c_r = margin + (cw * i) + (gutter * (i-1))
            c_l = c_r + gutter
            guides.append(f'    <guide id="p{pg_i}-c{i}r" position="{c_r}" orientation="vertical" pageNumber="{pg_i}" />')
            guides.append(f'    <guide id="p{pg_i}-c{i+1}l" position="{c_l}" orientation="vertical" pageNumber="{pg_i}" />')

    # --- GUÍAS HORIZONTALES (Calculadas para evitar solapamientos) ---
    t_top = margin
    t_bot = t_top + rng.choice([150, 200, 300]) # Altura del título
    
    s_top = t_bot + rng.choice([20, 40])
    s_bot = s_top + rng.choice([60, 100]) # Altura del subtítulo
    
    img_top = s_bot + rng.choice([40, 80])
    img_bot = img_top + rng.choice([400, 600, 800]) # Altura de imagen (si la hay)
    
    b_top = img_bot + rng.choice([40, 80])
    b_bot = H - margin # El cuerpo llega hasta el margen inferior

    guides.append(f'    <guide id="p{pg_i}-t-top" position="{t_top}" orientation="horizontal" pageNumber="{pg_i}" />')
    guides.append(f'    <guide id="p{pg_i}-t-bot" position="{t_bot}" orientation="horizontal" pageNumber="{pg_i}" />')
    guides.append(f'    <guide id="p{pg_i}-s-top" position="{s_top}" orientation="horizontal" pageNumber="{pg_i}" />')
    guides.append(f'    <guide id="p{pg_i}-s-bot" position="{s_bot}" orientation="horizontal" pageNumber="{pg_i}" />')
    guides.append(f'    <guide id="p{pg_i}-b-top" position="{b_top}" orientation="horizontal" pageNumber="{pg_i}" />')
    guides.append(f'    <guide id="p{pg_i}-b-bot" position="{b_bot}" orientation="horizontal" pageNumber="{pg_i}" />')
    
    return guides, img_top, (img_bot - img_top)

def build_page(rng, W, H, colors, fonts, n_cols, topic, pg_i, is_heavy, img_y, img_h, margin):
    lines = [f'  <page width="{W}" height="{H}" bgColor="{colors["bg"]}" name="Page {pg_i}">']
    
    # Textos: 4 anchors + autoFitSize. SIN x/y/w/h.
    ml, mr = f"p{pg_i}-ml", f"p{pg_i}-mr"
    
    # 1. TÍTULO
    title = generate_text_content(rng, topic, "title")
    lines.append(f'    <text leftAnchor="{ml}" rightAnchor="{mr}" topAnchor="p{pg_i}-t-top" bottomAnchor="p{pg_i}-t-bot"')
    lines.append(f'      autoFitSize="true" fontWeight="900" fontFamily="{fonts["display"]}"')
    lines.append(f'      color="{colors["text"]}" textAlign="left">{title}</text>')

    # 2. SUBTÍTULO
    subtitle = generate_text_content(rng, topic, "subtitle")
    lines.append(f'    <text leftAnchor="{ml}" rightAnchor="{mr}" topAnchor="p{pg_i}-s-top" bottomAnchor="p{pg_i}-s-bot"')
    lines.append(f'      autoFitSize="true" fontWeight="400" fontFamily="{fonts["body"]}" textTransform="uppercase"')
    lines.append(f'      color="{colors["accent"]}" textAlign="left" letterSpacing="4">{subtitle}</text>')

    # 3. IMAGEN / SHAPE (Estos SÍ pueden usar x, y, w, h porque no son texto)
    if rng.random() > 0.3:
        w_img = W - (margin * 2)
        lines.append(f'    <image x="{margin}" y="{img_y}" w="{w_img}" h="{img_h}"')
        lines.append(f'      src="https://picsum.photos/{w_img}/{img_h}?random={pg_i}{rng.randint(1,100)}" />')

    # 4. COLUMNAS DE TEXTO (BODY)
    if n_cols == 1:
        col_anchors = [(ml, mr)]
    elif n_cols == 2:
        col_anchors = [(ml, f"p{pg_i}-c1r"), (f"p{pg_i}-c2l", mr)]
    else:
        col_anchors = [(ml, f"p{pg_i}-c1r"), (f"p{pg_i}-c2l", f"p{pg_i}-c2r"), (f"p{pg_i}-c3l", mr)]

    for left_a, right_a in col_anchors:
        body = generate_text_content(rng, topic, "body", is_heavy)
        lines.append(f'    <text leftAnchor="{left_a}" rightAnchor="{right_a}" topAnchor="p{pg_i}-b-top" bottomAnchor="p{pg_i}-b-bot"')
        lines.append(f'      autoFitSize="true" fontWeight="300" fontFamily="{fonts["body"]}" lineHeight="1.6"')
        lines.append(f'      color="{colors["muted"]}" textAlign="justify" verticalAlign="top">{body}</text>')

    lines.append(f'  </page>')
    return lines

# ==========================================
# 5. INTEGRACIÓN IA Y DATASET
# ==========================================
def generate_tool_calling_entry(idx: int) -> dict:
    rng = random.Random(idx * 777)
    
    # Metadatos del diseño
    archetype = rng.choice(ARCHETYPES)
    colors = rng.choice(COLOR_SCHEMES)
    fonts = rng.choice(FONT_PAIRINGS)
    page_size = rng.choice(list(PAGE_SIZES.keys()))
    W, H = PAGE_SIZES[page_size]
    n_pages = rng.choices([1, 2, 3], weights=[50, 30, 20])[0]
    n_cols = rng.choice([1, 2, 3])
    margin = rng.choice([80, 120, 200, 300])
    topic = rng.choice(TOPICS)
    
    is_heavy = page_size in ["A4", "Tabloid", "Landscape_A4"]

    # --- CONSTRUIR JSX ---
    parts = ["<project>", f'  <config pageGap="80" showGrid="false" snapToGrid="true">']
    
    pages_data = []
    # Generar guías para todas las páginas en el <config>
    for pg_i in range(1, n_pages + 1):
        guides, img_y, img_h = build_guides(rng, pg_i, margin, W, H, n_cols)
        parts += guides
        pages_data.append((img_y, img_h)) # Guardamos datos para la fase de página
        
    parts.append("  </config>")
    
    # Generar las páginas
    for pg_i in range(1, n_pages + 1):
        img_y, img_h = pages_data[pg_i - 1]
        parts += build_page(rng, W, H, colors, fonts, n_cols, topic, pg_i, is_heavy, img_y, img_h, margin)
        
    parts.append("</project>")
    jsx = "\n".join(parts)

    # --- CHAIN OF THOUGHT (Agente razonando) ---
    layout_thought = f"Diseño complejo de {n_cols} columnas para formato {page_size}." if is_heavy else f"Diseño directo de {n_cols} columnas."
    thought = (
        f"ANALIZA: Petición de {archetype.replace('_', ' ')} sobre '{topic}'. {n_pages} página(s).\n"
        f"PLANIFICA: {layout_thought} Paleta '{colors['name']}'. Definiré márgenes de {margin}px. "
        f"Crearé conjuntos de guías independientes prefijados con p1-, p2-, etc.\n"
        f"CREA: Todo el texto estará anclado estrictamente a las guías (left, right, top, bottom) sin usar x,y,w,h. "
        f"Aplicaré autoFitSize='true' a titulares y cuerpos para delegar el cálculo del fontSize al motor.\n"
        f"VERIFICA: Diseño nuevo detectado, usaré 'apply_project'."
    )

    # --- SYSTEM PROMPT DROPOUT ---
    # 70% usa el prompt largo, 30% usa uno resumido para evitar overfitting al texto.
    if rng.random() < 0.7:
        sys_prompt = DS_SYSTEM_PROMPT
    else:
        sys_prompt = "Eres el núcleo IA de Design Studio. Reglas: Usa anchors completos en textos, usa autoFitSize, NUNCA uses x/y en textos. Piensa en <thought>."

    # --- TOOL NOISE ---
    # Pasamos múltiples herramientas barajadas para forzar al modelo a leer y elegir
    tools = [APPLY_PROJECT_TOOL, APPLY_PATCH_TOOL, GET_CANVAS_TOOL]
    rng.shuffle(tools)

    prompt = f"Diseña un {archetype.replace('_', ' ')} sobre {topic}. Usa {n_pages} páginas, formato {page_size} y {n_cols} columnas. Estilo de color: {colors['name']}."

    return {
        "id": f"ds_v4_{idx:05d}",
        "prompt": prompt,
        "jsx": jsx,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt},
            {
                "role": "assistant",
                "content": f"<thought>\n{thought}\n</thought>",
                "tool_calls": [
                    {
                        "id": f"call_apply_{idx:05d}",
                        "type": "function",
                        "function": {
                            "name": "apply_project",
                            "arguments": json.dumps({"jsx": jsx}, ensure_ascii=False)
                        }
                    }
                ]
            }
        ],
        "tools": tools,
        "curation": {
            "status": "pending",
            "tags": [page_size, f"{n_cols}-cols", "strict-rules", "has-thought"]
        }
    }

# ==========================================
# 6. EJECUCIÓN DEL SCRIPT
# ==========================================
if __name__ == "__main__":
    NUM_SAMPLES = 50 # Cambia este número para generar más o menos datos
    OUTPUT_FILE = "dataset_agente_autonomo.jsonl"
    
    print(f"Iniciando generación de {NUM_SAMPLES} ejemplos de entrenamiento...")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for i in range(NUM_SAMPLES):
            entry = generate_tool_calling_entry(i)
            # ensure_ascii=False mantiene los tildes y eñes legibles en el JSON
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
            if (i + 1) % 10 == 0:
                print(f"  -> Generados {i + 1} / {NUM_SAMPLES}")
                
    print(f"\n¡Éxito! Dataset guardado en: {OUTPUT_FILE}")
    print("Este archivo está listo para ser revisado en tu UI y luego usado para Fine-Tuning.")