"""
generate_apply_project_tool_synthetic_dataset.py
Generates a synthetic JSONL dataset for fine-tuning apply_project tool calling.
Run: python generate_apply_project_tool_synthetic_dataset.py
Output: ../dataset/raw/demo_batch.jsonl

v3: mucha mayor diversidad respecto a v2 -- mas temas (con vocabulario propio),
mas paletas/tipografias/tamanos de pagina, mas plantillas de titulo/hero/cuerpo/
quote/subtitulo/kicker/footer, layout real de 3 columnas, y variacion en el
formato del encabezado y del pie de pagina. El texto de cada pagina sigue
generandose a partir del `topic` del prompt (nunca un tema fijo distinto).
"""

import json, random, re
from pathlib import Path

# ──────────────────────────────────────────────────
# Design vocabulary
# ──────────────────────────────────────────────────

ARCHETYPES = [
    "magazine_cover", "magazine_editorial", "toc", "interview",
    "poster", "newsletter", "colophon", "photo_spread",
    "infographic", "lookbook", "product_launch", "annual_report",
]

COLOR_SCHEMES = [
    {"name": "dark_violet",     "bg": "#0f0f1a", "accent": "#6c5ce7", "text": "#ffffff",  "muted": "#a0a0b0"},
    {"name": "light_clean",     "bg": "#f8f9fa", "accent": "#2d3748", "text": "#1a1a2e",  "muted": "#666676"},
    {"name": "dark_gold",       "bg": "#1a1a2e", "accent": "#e2b714", "text": "#f0f0f0",  "muted": "#888899"},
    {"name": "warm_terracota",  "bg": "#fff8f0", "accent": "#c0392b", "text": "#2c2c2c",  "muted": "#888888"},
    {"name": "cool_blue",       "bg": "#f0f4f8", "accent": "#3182ce", "text": "#1a202c",  "muted": "#718096"},
    {"name": "dark_teal",       "bg": "#0d1f2d", "accent": "#00b4d8", "text": "#e0f7fa",  "muted": "#607d8b"},
    {"name": "pink_modern",     "bg": "#fff0f6", "accent": "#e91e8c", "text": "#1a0011",  "muted": "#9c4d7a"},
    {"name": "forest_dark",     "bg": "#0a1f0e", "accent": "#4caf50", "text": "#e8f5e9",  "muted": "#81c784"},
    {"name": "mono_light",      "bg": "#ffffff", "accent": "#000000", "text": "#111111",  "muted": "#666666"},
    {"name": "sunset_gradient", "bg": "#1a0533", "accent": "#ff6b35", "text": "#fff3e0",  "muted": "#ffab91"},
    {"name": "acid_lime",       "bg": "#0b0f0a", "accent": "#c6ff00", "text": "#f2fff0",  "muted": "#7fae5f"},
    {"name": "clay_neutral",    "bg": "#efe7dd", "accent": "#8a5a44", "text": "#2a221c",  "muted": "#8c8177"},
    {"name": "deep_maroon",     "bg": "#1c0a0f", "accent": "#d94f70", "text": "#fbe9ee",  "muted": "#a5717f"},
    {"name": "ice_slate",       "bg": "#e9edf2", "accent": "#5b7c99", "text": "#152230",  "muted": "#7c8b99"},
    {"name": "mustard_pop",     "bg": "#fdf6e3", "accent": "#c9971c", "text": "#2b2109",  "muted": "#9a865c"},
    {"name": "electric_indigo", "bg": "#0a0a1f", "accent": "#7c3aed", "text": "#eae6ff",  "muted": "#8b83ad"},
    {"name": "peach_soft",      "bg": "#fff1e6", "accent": "#e8734f", "text": "#3a1f14",  "muted": "#a67b6a"},
    {"name": "graphite_mint",   "bg": "#161a1d", "accent": "#3ddc97", "text": "#e8fff4",  "muted": "#6f9585"},
    {"name": "burnt_sienna",    "bg": "#2a1810", "accent": "#e2793e", "text": "#fbe8db",  "muted": "#b08a6f"},
    {"name": "porcelain_navy",  "bg": "#f2f4f8", "accent": "#1e3a5f", "text": "#0f1b2b",  "muted": "#5c7089"},
]

FONT_PAIRINGS = [
    {"name": "playfair_inter",       "display": "Playfair Display, serif",   "body": "Inter, sans-serif"},
    {"name": "oswald_inter",         "display": "Oswald, sans-serif",         "body": "Inter, sans-serif"},
    {"name": "cormorant_lato",       "display": "Cormorant Garamond, serif",  "body": "Lato, sans-serif"},
    {"name": "space_grotesk",        "display": "Space Grotesk, sans-serif",  "body": "Inter, sans-serif"},
    {"name": "bebas_opensans",       "display": "Bebas Neue, sans-serif",     "body": "Open Sans, sans-serif"},
    {"name": "merriweather_roboto",  "display": "Merriweather, serif",        "body": "Roboto, sans-serif"},
    {"name": "montserrat_source",    "display": "Montserrat, sans-serif",     "body": "Source Sans Pro, sans-serif"},
    {"name": "garamond_nunito",      "display": "EB Garamond, serif",         "body": "Nunito, sans-serif"},
    {"name": "syne_ibm",             "display": "Syne, sans-serif",           "body": "IBM Plex Sans, sans-serif"},
    {"name": "fraunces_karla",       "display": "Fraunces, serif",            "body": "Karla, sans-serif"},
    {"name": "unbounded_manrope",    "display": "Unbounded, sans-serif",      "body": "Manrope, sans-serif"},
    {"name": "sora_dm_sans",         "display": "Sora, sans-serif",           "body": "DM Sans, sans-serif"},
    {"name": "libre_caslon_inter",   "display": "Libre Caslon Text, serif",   "body": "Inter, sans-serif"},
    {"name": "archivo_black_mono",   "display": "Archivo Black, sans-serif",  "body": "Archivo, sans-serif"},
    {"name": "spectral_work",        "display": "Spectral, serif",            "body": "Work Sans, sans-serif"},
    {"name": "anton_dm",             "display": "Anton, sans-serif",          "body": "DM Sans, sans-serif"},
]

PAGE_SIZES = {
    "A4":      (2480, 3508),
    "Letter":  (2550, 3300),
    "Square":  (2480, 2480),
    "Tabloid": (4960, 3508),
    "Story":   (1080, 1920),
    "Poster":  (1920, 2880),
    "Landscape_A4": (3508, 2480),
    "Compact":  (1600, 2000),
}

# ──────────────────────────────────────────────────
# Topic vocabulary
#
# Cada topic tiene un "field" (frase para insertar en plantillas como
# "el futuro de {field}"), una lista de "concepts" (sustantivos con
# articulo) y una lista de "adjectives" (ya concordados en genero con el
# genero del propio field, para que las plantillas que hacen predicado
# directo sobre {field} u otro sustantivo femenino fijo no rompan la
# concordancia). Estas piezas se combinan con las plantillas de mas abajo
# para generar titulos, subtitulos, cuerpos de texto y pull-quotes
# coherentes con el topic elegido en el prompt.
# ──────────────────────────────────────────────────

TOPIC_VOCAB = {
    "diseño editorial": {
        "field": "el diseño editorial",
        "concepts": ["la retícula", "el layout", "la jerarquía tipográfica", "el ritmo visual", "la maquetación"],
        "adjectives": ["modular", "estructural", "ágil", "riguroso", "expresivo"],
    },
    "tipografía variable": {
        "field": "la tipografía variable",
        "concepts": ["los ejes paramétricos", "el peso tipográfico", "la fuente adaptativa", "el trazo dinámico", "la escala óptica"],
        "adjectives": ["paramétrica", "flexible", "adaptativa", "fluida", "responsiva"],
    },
    "moda urbana": {
        "field": "la moda urbana",
        "concepts": ["el streetwear", "la silueta", "el textil técnico", "la subcultura", "el drop limitado"],
        "adjectives": ["audaz", "callejera", "híbrida", "irreverente", "contemporánea"],
    },
    "arquitectura minimalista": {
        "field": "la arquitectura minimalista",
        "concepts": ["el volumen puro", "la luz natural", "el material crudo", "el espacio negativo", "la geometría"],
        "adjectives": ["austera", "geométrica", "silenciosa", "esencial", "depurada"],
    },
    "inteligencia artificial": {
        "field": "la inteligencia artificial",
        "concepts": ["el modelo generativo", "el algoritmo", "el aprendizaje automático", "la red neuronal", "el dato"],
        "adjectives": ["emergente", "adaptativa", "predictiva", "autónoma", "disruptiva"],
    },
    "fotografía analógica": {
        "field": "la fotografía analógica",
        "concepts": ["el grano", "el revelado", "la película", "la luz latente", "el cuarto oscuro"],
        "adjectives": ["texturizada", "nostálgica", "imperfecta", "táctil", "artesanal"],
    },
    "música independiente": {
        "field": "la música independiente",
        "concepts": ["el sello autogestionado", "la escena local", "el vinilo", "la producción casera", "la gira"],
        "adjectives": ["cruda", "auténtica", "experimental", "underground", "vibrante"],
    },
    "gastronomía de autor": {
        "field": "la gastronomía de autor",
        "concepts": ["el producto de temporada", "la técnica", "el menú degustación", "el maridaje", "la mesa"],
        "adjectives": ["sensorial", "refinada", "conceptual", "estacional", "artesanal"],
    },
    "cine contemporáneo": {
        "field": "el cine contemporáneo",
        "concepts": ["el encuadre", "la narrativa", "el montaje", "la fotografía", "el guion"],
        "adjectives": ["visceral", "introspectivo", "fragmentado", "poético", "arriesgado"],
    },
    "sostenibilidad y diseño": {
        "field": "la sostenibilidad en el diseño",
        "concepts": ["el material reciclado", "el ciclo de vida", "la economía circular", "el impacto ambiental", "el consumo consciente"],
        "adjectives": ["regenerativa", "responsable", "circular", "consciente", "duradera"],
    },
    "identidad visual": {
        "field": "la identidad visual",
        "concepts": ["el logotipo", "el sistema gráfico", "la paleta de marca", "el tono visual", "el manual de marca"],
        "adjectives": ["coherente", "memorable", "versátil", "distintiva", "sólida"],
    },
    "arte generativo": {
        "field": "el arte generativo",
        "concepts": ["el código como pincel", "el algoritmo estético", "el sistema aleatorio", "el patrón emergente", "la pieza procedural"],
        "adjectives": ["procedural", "impredecible", "algorítmico", "orgánico", "infinito"],
    },
    "tecnología wearable": {
        "field": "la tecnología wearable",
        "concepts": ["el sensor", "la interfaz corporal", "el textil inteligente", "el dato biométrico", "el dispositivo portátil"],
        "adjectives": ["integrada", "portátil", "sensorial", "conectada", "invisible"],
    },
    "branding global": {
        "field": "el branding global",
        "concepts": ["la narrativa de marca", "el posicionamiento", "la consistencia cultural", "el símbolo", "la experiencia de marca"],
        "adjectives": ["escalable", "coherente", "universal", "memorable", "estratégico"],
    },
    "cultura digital": {
        "field": "la cultura digital",
        "concepts": ["el meme", "la comunidad online", "el algoritmo social", "el contenido viral", "la identidad digital"],
        "adjectives": ["fugaz", "viral", "descentralizada", "colectiva", "líquida"],
    },
    "publicidad creativa": {
        "field": "la publicidad creativa",
        "concepts": ["el insight", "el concepto", "la campaña", "el mensaje", "la idea disruptiva"],
        "adjectives": ["disruptiva", "memorable", "ingeniosa", "persuasiva", "audaz"],
    },
    "ilustración editorial": {
        "field": "la ilustración editorial",
        "concepts": ["el trazo", "la metáfora visual", "la composición narrativa", "el color", "la síntesis gráfica"],
        "adjectives": ["expresiva", "simbólica", "narrativa", "gestual", "conceptual"],
    },
    "diseño de producto": {
        "field": "el diseño de producto",
        "concepts": ["el prototipo", "la ergonomía", "el material", "la función", "la iteración"],
        "adjectives": ["funcional", "iterativo", "táctil", "preciso", "honesto"],
    },
    "urbanismo táctico": {
        "field": "el urbanismo táctico",
        "concepts": ["el espacio público", "la intervención temporal", "la movilidad activa", "la plaza", "el mobiliario urbano"],
        "adjectives": ["participativo", "flexible", "provisional", "comunitario", "reversible"],
    },
    "cripto y web3": {
        "field": "el ecosistema cripto",
        "concepts": ["el contrato inteligente", "la wallet", "el token", "la comunidad descentralizada", "el protocolo abierto"],
        "adjectives": ["descentralizado", "volátil", "transparente", "programable", "especulativo"],
    },
    "salud digital": {
        "field": "la salud digital",
        "concepts": ["el sensor biométrico", "el historial clínico digital", "la telemedicina", "el algoritmo diagnóstico", "el dato del paciente"],
        "adjectives": ["preventiva", "personalizada", "accesible", "conectada", "confiable"],
    },
    "deporte y rendimiento": {
        "field": "el rendimiento deportivo",
        "concepts": ["la biomecánica", "la carga de entrenamiento", "el dato fisiológico", "la recuperación", "la técnica de ejecución"],
        "adjectives": ["explosivo", "metódico", "medible", "constante", "resiliente"],
    },
    "educación abierta": {
        "field": "la educación abierta",
        "concepts": ["el recurso libre", "el aprendizaje entre pares", "el aula distribuida", "el contenido modular", "la autonomía del estudiante"],
        "adjectives": ["accesible", "colaborativa", "modular", "flexible", "inclusiva"],
    },
    "turismo experiencial": {
        "field": "el turismo experiencial",
        "concepts": ["el itinerario a medida", "el encuentro local", "la narrativa de destino", "el viaje lento", "la memoria sensorial"],
        "adjectives": ["inmersivo", "auténtico", "pausado", "sensorial", "memorable"],
    },
    "arte textil": {
        "field": "el arte textil",
        "concepts": ["el telar", "la fibra natural", "el bordado", "el tinte artesanal", "la trama"],
        "adjectives": ["táctil", "artesanal", "paciente", "orgánico", "gestual"],
    },
}

TOPICS = list(TOPIC_VOCAB.keys())


def _strip_article(phrase: str) -> str:
    for art in ("el ", "la ", "los ", "las "):
        if phrase.startswith(art):
            return phrase[len(art):]
    return phrase


def _vocab_pick(rng: random.Random, topic: str):
    """Returns (field, concept, adjective) sampled for this topic."""
    v = TOPIC_VOCAB[topic]
    field = v["field"]
    concept = rng.choice(v["concepts"])
    adjective = rng.choice(v["adjectives"])
    return field, concept, adjective


# ──────────────────────────────────────────────────
# Writing templates (parametrized by topic vocabulary)
# ──────────────────────────────────────────────────

HERO_TEMPLATES = [
    "{Field}, es el lenguaje del futuro",
    "Donde {concept} se convierte en arte",
    "{Adjective}, por naturaleza",
    "La forma sigue a {concept}",
    "{Field}, sin límites",
    "Repensar {concept} desde cero",
    "{Concept}, redefinido",
    "Todo comienza en {concept}",
    "{Field}: una nueva gramática",
    "El futuro ya vive en {concept}",
]

TITLE_TEMPLATES = [
    "El lenguaje de {field}",
    "Más allá de {concept}",
    "{Field_cap} radical",
    "{Field_cap} sin límites",
    "Repensando {concept}",
    "La era de {field}",
    "{Concept_cap}, hoy",
    "Notas sobre {concept}",
    "{Field_cap}: un nuevo mapa",
    "Dentro de {concept}",
    "El próximo capítulo de {field}",
    "{Concept_cap} y lo que viene",
]

SENTENCE_TEMPLATES = [
    "{Field_cap} atraviesa una transformación profunda, redefiniendo sus propios límites.",
    "{Concept_cap} se ha convertido en el centro de un intenso debate sobre el futuro de la disciplina.",
    "Quienes trabajan en {field} exploran nuevas formas de expresión a través de {concept}.",
    "Esta metamorfosis no es solo técnica: es cultural, conceptual y {adjective}.",
    "{Concept_cap} abre una vía {adjective} hacia experiencias inéditas.",
    "El diálogo entre tradición e innovación define el rumbo de {field} actual.",
    "Cada vez más, {concept} determina cómo entendemos {field} en el presente.",
    "Observar {concept} de cerca revela una escena {adjective} y en constante cambio.",
    "El público exige algo distinto, y {field} responde con nuevas preguntas.",
    "Nada en {field} permanece igual una vez que {concept} entra en escena.",
    "La conversación en torno a {field} ya no cabe en las categorías de siempre.",
    "{Concept_cap} funciona como un espejo de las tensiones propias de {field}.",
    "Detrás de {concept} hay una comunidad {adjective} que redefine las reglas.",
    "{Field_cap} exige hoy una mirada tan {adjective} como crítica.",
    "Entender {concept} es, en el fondo, entender hacia dónde va {field}.",
]

QUOTE_TEMPLATES = [
    '"{Concept_cap} no es una evolución técnica, es un cambio de paradigma"',
    '"{Field_cap} nos obliga a repensar lo que creíamos saber"',
    '"En {concept} encontramos su verdadera esencia"',
    '"Lo mejor de {field} está solo comenzando"',
    '"{Concept_cap} es, ante todo, una forma de mirar"',
    '"No se puede entender {field} sin pasar por {concept}"',
    '"{Field_cap} se construye, un detalle a la vez"',
    '"{Concept_cap} cambió la forma en que pensamos {field}"',
]

KICKER_TEMPLATES = [
    "{TOPIC}",
    "SOBRE {TOPIC}",
    "EDICIÓN {TOPIC}",
    "EN FOCO: {TOPIC}",
    "DOSIER · {TOPIC}",
]

SUBTITLE_TEMPLATES = [
    "{TOPIC} · {issue:02d} · {year}",
    "N.º {issue:02d} — {TOPIC} — {year}",
    "{TOPIC} / EDICIÓN {year}",
    "VOL. {issue} · {TOPIC}",
    "{TOPIC} · ISSUE {issue:02d}",
]

FOOTER_TEMPLATES = [
    "DESIGN STUDIO · PUBLICACIÓN TRIMESTRAL · designstudio.com",
    "STUDIO REVIEW · EDICIÓN ESPECIAL · studioreview.com",
    "THE FIELD NOTES · NÚMERO LIMITADO · fieldnotes.press",
    "ATLAS JOURNAL · PUBLICACIÓN INDEPENDIENTE · atlasjournal.co",
    "NORTE STUDIO · TIRADA LIMITADA · nortestudio.com",
    "PAPER & CODE · PUBLICACIÓN DIGITAL · paperandcode.io",
]

COVER_WORD_POOL_EXTRA = ["DESIGN", "FORM", "STUDIO", "CRAFT", "VISION", "SIGNAL", "ORIGIN"]


def _fmt(template: str, field: str, concept: str, adjective: str) -> str:
    field_cap = field[0].upper() + field[1:]
    concept_cap = concept[0].upper() + concept[1:]
    text = template.format(
        field=field,
        concept=concept,
        adjective=adjective,
        Field_cap=field_cap,
        Concept_cap=concept_cap,
        Adjective=adjective[0].upper() + adjective[1:],
        Field=field_cap,
        Concept=concept_cap,
    )
    # Contracciones obligatorias del español: "de el" -> "del", "a el" -> "al"
    # (aplica cuando field/concept empieza con el articulo masculino "el ").
    text = re.sub(r"\bde el\b", "del", text)
    text = re.sub(r"\ba el\b", "al", text)
    text = re.sub(r"\bDe el\b", "Del", text)
    text = re.sub(r"\bA el\b", "Al", text)
    text = re.sub(r",\s*,", ",", text)  # limpia comas dobles si el template las genera
    return text


def build_paragraph(rng: random.Random, topic: str, n_sentences: int = 3) -> str:
    """Builds a coherent paragraph about `topic` from sentence templates."""
    chosen = rng.sample(SENTENCE_TEMPLATES, k=min(n_sentences, len(SENTENCE_TEMPLATES)))
    sentences = []
    for tpl in chosen:
        field, concept, adjective = _vocab_pick(rng, topic)
        sentences.append(_fmt(tpl, field, concept, adjective))
    return " ".join(sentences)


def build_title(rng: random.Random, topic: str) -> str:
    field, concept, adjective = _vocab_pick(rng, topic)
    tpl = rng.choice(TITLE_TEMPLATES)
    return _fmt(tpl, field, concept, adjective)


def build_hero_line(rng: random.Random, topic: str) -> str:
    field, concept, adjective = _vocab_pick(rng, topic)
    tpl = rng.choice(HERO_TEMPLATES)
    return _fmt(tpl, field, concept, adjective)


def build_quote(rng: random.Random, topic: str) -> str:
    field, concept, adjective = _vocab_pick(rng, topic)
    tpl = rng.choice(QUOTE_TEMPLATES)
    return _fmt(tpl, field, concept, adjective)


def build_kicker(rng: random.Random, topic: str) -> str:
    tpl = rng.choice(KICKER_TEMPLATES)
    return tpl.format(TOPIC=topic.upper())


def build_subtitle(rng: random.Random, topic: str, issue_no: int, year: int) -> str:
    tpl = rng.choice(SUBTITLE_TEMPLATES)
    return tpl.format(TOPIC=topic.upper(), issue=issue_no, year=year)


def build_cover_word(rng: random.Random, topic: str) -> str:
    v = TOPIC_VOCAB[topic]
    if rng.random() < 0.6:
        concept = rng.choice(v["concepts"])
        return _strip_article(concept).upper()
    return rng.choice(COVER_WORD_POOL_EXTRA)


# ──────────────────────────────────────────────────
# JSX template builders
# ──────────────────────────────────────────────────

def build_guides(rng: random.Random, page_num, margin, W, n_cols, suffix=""):
    guides = []
    guides.append(f'    <guide id="ml{suffix}" position="{margin}" orientation="vertical" pageNumber="{page_num}" />')
    guides.append(f'    <guide id="mr{suffix}" position="{W - margin}" orientation="vertical" pageNumber="{page_num}" />')
    if n_cols == 2:
        gutter = rng.choice([60, 80, 100])
        cw = (W - 2*margin - gutter) // 2
        c1r = margin + cw
        c2l = c1r + gutter
        guides.append(f'    <guide id="c1r{suffix}" position="{c1r}" orientation="vertical" pageNumber="{page_num}" />')
        guides.append(f'    <guide id="c2l{suffix}" position="{c2l}" orientation="vertical" pageNumber="{page_num}" />')
    elif n_cols == 3:
        gutter = rng.choice([50, 70, 90])
        cw = (W - 2*margin - 2*gutter) // 3
        c1r = margin + cw
        c2l = c1r + gutter
        c2r = c2l + cw
        c3l = c2r + gutter
        guides.append(f'    <guide id="c1r{suffix}" position="{c1r}" orientation="vertical" pageNumber="{page_num}" />')
        guides.append(f'    <guide id="c2l{suffix}" position="{c2l}" orientation="vertical" pageNumber="{page_num}" />')
        guides.append(f'    <guide id="c2r{suffix}" position="{c2r}" orientation="vertical" pageNumber="{page_num}" />')
        guides.append(f'    <guide id="c3l{suffix}" position="{c3l}" orientation="vertical" pageNumber="{page_num}" />')
    # horizontal guides
    h_guides = sorted(rng.sample(range(200, 3200, 100), k=rng.randint(2, 4)))
    for pos in h_guides:
        guides.append(f'    <guide position="{pos}" orientation="horizontal" pageNumber="{page_num}" />')
    return guides


def build_cover_page(rng: random.Random, W, H, colors, fonts, margin, topic, issue_no, year, suffix=""):
    ml = f"ml{suffix}"
    mr = f"mr{suffix}"
    lines = [f'  <page width="{W}" height="{H}" bgColor="{colors["bg"]}" name="Cover">']

    # Big title
    title_size = rng.choice([120, 140, 160, 200])
    cover_word = build_cover_word(rng, topic)
    lines.append(f'    <text x="{margin}" y="300" w="{W - 2*margin}" h="{title_size + 40}"')
    lines.append(f'      fontSize="{title_size}" fontWeight="900" fontFamily="{fonts["display"]}"')
    lines.append(f'      color="{colors["text"]}" textAlign="center" textTransform="uppercase"')
    lines.append(f'      autoFitSize="true" letterSpacing="{rng.randint(4, 20)}"')
    lines.append(f'      leftAnchor="{ml}" rightAnchor="{mr}">')
    lines.append(f'      {cover_word}')
    lines.append(f'    </text>')

    # Subtitle
    subtitle = build_subtitle(rng, topic, issue_no, year)
    lines.append(f'    <text x="{margin}" y="600" w="{W - 2*margin}" h="60"')
    lines.append(f'      fontSize="24" fontWeight="300" fontFamily="{fonts["body"]}"')
    lines.append(f'      color="{colors["accent"]}" textAlign="center" letterSpacing="12" textTransform="uppercase"')
    lines.append(f'      leftAnchor="{ml}" rightAnchor="{mr}">')
    lines.append(f'      {subtitle}')
    lines.append(f'    </text>')

    # Pull quote / hero line
    hero = build_hero_line(rng, topic)
    lines.append(f'    <text x="{margin + 120}" y="{H // 2}" w="{W - 2*margin - 240}" h="200"')
    lines.append(f'      fontSize="72" fontWeight="700" fontFamily="{fonts["display"]}"')
    lines.append(f'      color="{colors["text"]}" textAlign="center" fontStyle="italic"')
    lines.append(f'      autoFitSize="true"')
    lines.append(f'      leftAnchor="{ml}" leftAnchorOffset="120" rightAnchor="{mr}" rightAnchorOffset="-120">')
    lines.append(f'      "{hero}"')
    lines.append(f'    </text>')

    # Footer
    footer = rng.choice(FOOTER_TEMPLATES)
    lines.append(f'    <text x="{margin}" y="{H - 120}" w="{W - 2*margin}" h="40"')
    lines.append(f'      fontSize="14" fontWeight="300" fontFamily="{fonts["body"]}"')
    lines.append(f'      color="{colors["muted"]}" textAlign="center" letterSpacing="6" textTransform="uppercase"')
    lines.append(f'      leftAnchor="{ml}" rightAnchor="{mr}">')
    lines.append(f'      {footer}')
    lines.append(f'    </text>')
    lines.append(f'  </page>')
    return lines


def build_editorial_page(rng: random.Random, W, H, colors, fonts, margin, n_cols, topic, suffix=""):
    ml = f"ml{suffix}"
    mr = f"mr{suffix}"
    c1r = f"c1r{suffix}"
    c2l = f"c2l{suffix}"
    c2r = f"c2r{suffix}"
    c3l = f"c3l{suffix}"
    lines = [f'  <page width="{W}" height="{H}" bgColor="{colors["bg"]}" name="Editorial">']

    # Running head / kicker
    kicker = build_kicker(rng, topic)
    lines.append(f'    <text x="{margin}" y="80" w="{W - 2*margin}" h="40"')
    lines.append(f'      fontSize="14" fontWeight="600" fontFamily="{fonts["body"]}"')
    lines.append(f'      color="{colors["accent"]}" textAlign="left" letterSpacing="6" textTransform="uppercase"')
    lines.append(f'      leftAnchor="{ml}" rightAnchor="{mr}">')
    lines.append(f'      {kicker}')
    lines.append(f'    </text>')

    # Main title
    title_size = rng.choice([64, 80, 96])
    title_text = build_title(rng, topic)
    lines.append(f'    <text x="{margin}" y="200" w="{W - 2*margin}" h="{title_size + 60}"')
    lines.append(f'      fontSize="{title_size}" fontWeight="700" fontFamily="{fonts["display"]}"')
    lines.append(f'      color="{colors["text"]}" textAlign="left" autoFitSize="true"')
    lines.append(f'      leftAnchor="{ml}" rightAnchor="{mr}">')
    lines.append(f'      {title_text}')
    lines.append(f'    </text>')

    if n_cols == 2:
        y_body = 600
        col_w_approx = (W - 2*margin) // 2 - 40
        left_text = build_paragraph(rng, topic, n_sentences=rng.randint(2, 3))
        right_text = build_paragraph(rng, topic, n_sentences=rng.randint(2, 3))
        lines.append(f'    <text x="{margin}" y="{y_body}" w="{col_w_approx}" h="500"')
        lines.append(f'      fontSize="20" fontWeight="300" fontFamily="{fonts["body"]}"')
        lines.append(f'      color="{colors["text"]}" textAlign="left" verticalAlign="top" lineHeight="1.8"')
        lines.append(f'      leftAnchor="{ml}" rightAnchor="{c1r}">')
        lines.append(f'      {left_text}')
        lines.append(f'    </text>')
        lines.append(f'    <text x="{margin + col_w_approx + 80}" y="{y_body}" w="{col_w_approx}" h="500"')
        lines.append(f'      fontSize="20" fontWeight="300" fontFamily="{fonts["body"]}"')
        lines.append(f'      color="{colors["text"]}" textAlign="left" verticalAlign="top" lineHeight="1.8"')
        lines.append(f'      leftAnchor="{c2l}" rightAnchor="{mr}">')
        lines.append(f'      {right_text}')
        lines.append(f'    </text>')
        quote = build_quote(rng, topic)
        lines.append(f'    <text x="{margin + 120}" y="{y_body + 560}" w="{W - 2*margin - 240}" h="120"')
        lines.append(f'      fontSize="32" fontWeight="400" fontFamily="{fonts["display"]}"')
        lines.append(f'      color="{colors["accent"]}" textAlign="center" fontStyle="italic"')
        lines.append(f'      leftAnchor="{ml}" leftAnchorOffset="120" rightAnchor="{mr}" rightAnchorOffset="-120">')
        lines.append(f'      {quote}')
        lines.append(f'    </text>')

    elif n_cols == 3:
        y_body = 600
        col_w_approx = (W - 2*margin) // 3 - 50
        anchors = [(ml, c1r), (c2l, c2r), (c3l, mr)]
        for col_i, (left_a, right_a) in enumerate(anchors):
            col_text = build_paragraph(rng, topic, n_sentences=rng.randint(2, 3))
            x_off = margin + col_i * (col_w_approx + 70)
            lines.append(f'    <text x="{x_off}" y="{y_body}" w="{col_w_approx}" h="500"')
            lines.append(f'      fontSize="18" fontWeight="300" fontFamily="{fonts["body"]}"')
            lines.append(f'      color="{colors["text"]}" textAlign="left" verticalAlign="top" lineHeight="1.7"')
            lines.append(f'      leftAnchor="{left_a}" rightAnchor="{right_a}">')
            lines.append(f'      {col_text}')
            lines.append(f'    </text>')
        quote = build_quote(rng, topic)
        lines.append(f'    <text x="{margin + 120}" y="{y_body + 560}" w="{W - 2*margin - 240}" h="120"')
        lines.append(f'      fontSize="30" fontWeight="400" fontFamily="{fonts["display"]}"')
        lines.append(f'      color="{colors["accent"]}" textAlign="center" fontStyle="italic"')
        lines.append(f'      leftAnchor="{ml}" leftAnchorOffset="120" rightAnchor="{mr}" rightAnchorOffset="-120">')
        lines.append(f'      {quote}')
        lines.append(f'    </text>')

    else:
        body_text = build_paragraph(rng, topic, n_sentences=rng.randint(3, 4))
        lines.append(f'    <text x="{margin}" y="600" w="{W - 2*margin}" h="600"')
        lines.append(f'      fontSize="22" fontWeight="300" fontFamily="{fonts["body"]}"')
        lines.append(f'      color="{colors["text"]}" textAlign="left" verticalAlign="top" lineHeight="1.8"')
        lines.append(f'      leftAnchor="{ml}" rightAnchor="{mr}">')
        lines.append(f'      {body_text}')
        lines.append(f'    </text>')

    lines.append(f'  </page>')
    return lines


# ──────────────────────────────────────────────────
# Auto-tagging for training attributes
# ──────────────────────────────────────────────────

def _is_dark_bg(hex_color: str) -> bool:
    """Naive brightness check: sum of RGB components < 384 → dark."""
    h = hex_color.lstrip("#")
    if len(h) != 6: return False
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return r + g + b < 384


DARK_ARCHETYPES = {"magazine_cover", "magazine_editorial", "interview", "colophon", "photo_spread", "lookbook", "annual_report"}
LIGHT_ARCHETYPES = {"poster", "newsletter", "infographic", "product_launch"}


def auto_tags(archetype: str, colors: dict, fonts: dict, n_pages: int, n_cols: int, page_size: str) -> list:
    tags = []

    # Page structure
    if n_pages > 1:
        tags.append("multi-page")
    else:
        tags.append("single-page")
    tags.append("has-config")

    # Visual style
    is_dark = _is_dark_bg(colors["bg"])
    if is_dark:
        tags.append("dark-mode")
    else:
        tags.append("light-mode")

    if archetype in DARK_ARCHETYPES:
        if "elegant" not in tags: tags.append("elegant")
    if archetype in LIGHT_ARCHETYPES:
        if "minimal" not in tags: tags.append("minimal")

    editorial_archetypes = {"magazine_cover", "magazine_editorial", "toc", "interview", "colophon", "photo_spread", "lookbook", "annual_report"}
    if archetype in editorial_archetypes:
        tags.append("editorial")

    # Layout
    if n_cols > 1:
        tags.append("good-grid")
        tags.append("well-structured")
    if n_cols == 3:
        tags.append("complex-layout")

    # Typography — every generated design has curated font pairings
    tags.append("good-typography")
    # Some specific pairings are bold/display-heavy
    bold_fonts = {"oswald_inter", "bebas_opensans", "archivo_black_mono", "anton_dm", "unbounded_manrope"}
    if fonts["name"] in bold_fonts:
        tags.append("bold-typography")

    # Color quality
    accent_r, accent_g, accent_b = int(colors["accent"].lstrip("#")[0:2], 16), int(colors["accent"].lstrip("#")[2:4], 16), int(colors["accent"].lstrip("#")[4:6], 16)
    text_r, text_g, text_b = int(colors["text"].lstrip("#")[0:2], 16), int(colors["text"].lstrip("#")[2:4], 16), int(colors["text"].lstrip("#")[4:6], 16)
    if is_dark:
        # On dark bg, light text → high contrast
        if text_r + text_g + text_b > 600:
            tags.append("high-contrast")
        tags.append("good-colors")
    else:
        # On light bg, dark text → high contrast
        if text_r + text_g + text_b < 300:
            tags.append("high-contrast")
        tags.append("good-colors")

    # Palette harmony (most synthetic schemes are designed to be harmonious)
    tags.append("harmonious-palette")

    # Content
    tags.append("well-written")
    tags.append("consistent")

    # Page size based
    if page_size in ("Poster", "Tabloid", "Landscape_A4"):
        tags.append("asymmetric")

    return tags


def generate_design(idx: int) -> dict:
    rng = random.Random(idx * 7919)

    archetype  = rng.choice(ARCHETYPES)
    colors     = rng.choice(COLOR_SCHEMES)
    fonts      = rng.choice(FONT_PAIRINGS)
    n_pages    = rng.choices([1, 2, 3, 4, 5], weights=[15, 20, 30, 20, 15])[0]
    n_cols     = rng.choices([1, 2, 3], weights=[20, 60, 20])[0]
    page_size  = rng.choice(list(PAGE_SIZES.keys()))
    W, H       = PAGE_SIZES[page_size]
    margin     = rng.choice([80, 100, 120, 160, 200])
    page_gap   = rng.choice([0, 20, 40, 60, 80])
    topic      = rng.choice(TOPICS)
    issue_no   = rng.randint(1, 12)
    year       = rng.randint(2024, 2026)

    # Build JSX
    parts = ["<project>"]
    parts.append(f'  <config pageGap="{page_gap}" showGrid="false" snapToGrid="false" showRulers="true" guideMode="page" gridSize="20">')

    all_guides = []
    for pg_i in range(1, n_pages + 1):
        suffix = f"-p{pg_i}"
        all_guides += build_guides(rng, pg_i, margin, W, n_cols, suffix)

    parts += all_guides
    parts.append("  </config>")
    parts.append("")

    for pg_i in range(1, n_pages + 1):
        suffix = f"-p{pg_i}"
        if pg_i == 1 and archetype in ("magazine_cover", "poster", "product_launch"):
            parts += build_cover_page(rng, W, H, colors, fonts, margin, topic, issue_no, year, suffix)
        else:
            parts += build_editorial_page(rng, W, H, colors, fonts, margin, n_cols, topic, suffix)
        parts.append("")

    parts.append("</project>")
    jsx = "\n".join(parts)

    # Synthetic reward scores (will be replaced by real scorer)
    reward = {
        "total":       round(rng.uniform(0.50, 0.95), 3),
        "grid":        round(rng.uniform(0.60, 1.00), 3),
        "typographic": round(rng.uniform(0.50, 1.00), 3),
        "contrast":    round(rng.uniform(0.55, 1.00), 3),
        "hierarchy":   round(rng.uniform(0.50, 1.00), 3),
        "spacing":     round(rng.uniform(0.45, 1.00), 3),
        "validity":    1.0,
    }

    prompt = (
        f"Diseño de {archetype.replace('_', ' ')}, {n_pages} {'página' if n_pages==1 else 'páginas'}, "
        f"sobre {topic}, paleta {colors['name'].replace('_', ' ')}, "
        f"tipografía {fonts['name'].replace('_', ' ')}, "
        f"{'1 columna' if n_cols==1 else f'{n_cols} columnas'}, "
        f"tamaño {page_size}"
    )

    training_tags = auto_tags(archetype, colors, fonts, n_pages, n_cols, page_size)

    return {
        "id":       f"ds_{idx:06d}",
        "prompt":   prompt,
        "jsx":      jsx,
        "metadata": {
            "archetype":    archetype,
            "n_pages":      n_pages,
            "n_cols":       n_cols,
            "page_size":    page_size,
            "color_scheme": colors["name"],
            "font_pairing": fonts["name"],
            "margin":       margin,
            "page_gap":     page_gap,
            "topic":        topic,
            "reward":       reward,
            "generation":   0,
            "source":       "synthetic_cold",
            "tags":         training_tags.copy(),
        },
        "curation": {
            "status":      "pending",
            "approved_by": None,
            "notes":       "",
            "tags":        training_tags.copy(),
        }
    }


# ──────────────────────────────────────────────────
# Tool-calling training format (messages+tools+tool_calls)
# ──────────────────────────────────────────────────

APPLY_PROJECT_TOOL = {
    "type": "function",
    "function": {
        "name": "apply_project",
        "description": (
            "Replace the ENTIRE project with a new complete JSX design. "
            "This tool receives a full <project> JSX string and replaces "
            "the current design entirely — pages, elements, guides, config."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "jsx": {
                    "type": "string",
                    "description": (
                        "The complete <project> JSX string defining the entire design, "
                        "including <config>, <page>, and all element definitions."
                    ),
                }
            },
            "required": ["jsx"],
        },
    },
}

SYSTEM_PROMPT = (
    "Eres un diseñador experto en DesignStudio, un motor de diseño editorial "
    "basado en JSX. Tu especialidad es crear diseños completos y profesionales "
    "usando la herramienta apply_project. Cuando recibas un prompt de diseño, "
    "debes generar el JSX completo del <project> con páginas, guías, elementos "
    "de texto, imágenes y formas. El diseño debe ser coherente, bien estructurado "
    "y visualmente atractivo."
)


def generate_tool_calling_entry(idx: int) -> dict:
    """Generate unified entry: DesignEntry fields (curator) + messages+tools (training)."""
    d = generate_design(idx)
    jsx = d["jsx"]
    prompt = d["prompt"]
    tags = d["curation"]["tags"]

    attrs_context = ""
    if tags:
        attrs_context = (
            "\n\nEl diseno debe tener las siguientes cualidades: "
            + ", ".join(tags)
            + "."
        )

    tool_call_id = f"call_{idx:06d}"

    d["messages"] = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT + attrs_context,
        },
        {
            "role": "user",
            "content": prompt,
        },
        {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {
                    "id": tool_call_id,
                    "type": "function",
                    "function": {
                        "name": "apply_project",
                        "arguments": json.dumps({"jsx": jsx}, ensure_ascii=False),
                    },
                }
            ],
        },
    ]
    d["tools"] = [APPLY_PROJECT_TOOL]
    return d


# ──────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate synthetic DesignStudio dataset")
    parser.add_argument("--count",  type=int, default=50,  help="Number of designs to generate")
    parser.add_argument("--output", type=str, default="../dataset/raw/demo_batch.jsonl", help="Output JSONL path")
    parser.add_argument("--seed",   type=int, default=42,  help="Base random seed")
    args = parser.parse_args()

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating {args.count} designs (unified tool-calling + curator format) -> {out_path}")

    with open(out_path, "w", encoding="utf-8") as f:
        for i in range(args.count):
            entry = generate_tool_calling_entry(i)
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            if (i + 1) % 10 == 0:
                print(f"  {i+1}/{args.count} done...")

    print(f"OK Dataset saved to {out_path}")
    print(f"  Load it in the curator at http://localhost:5174")
    print(f"  Use this for fine-tuning a model to call apply_project")