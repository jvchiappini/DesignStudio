# ds-trainer — DesignStudio Dataset & Training Pipeline

**Completamente separado del editor DesignStudio.**

## Estructura

```
ds-trainer/
├── curator/          # App web HITL de curación (Vite + React standalone)
├── generator/        # Scripts Python de generación sintética
├── scripts/          # RL training, SFT, evaluación
└── dataset/
    ├── raw/          # Diseños generados sin filtrar (.jsonl)
    ├── curated/      # Aprobados por el humano (.jsonl)
    └── golden/       # Top-tier: curated + reward > 0.85 (.jsonl)
```

## Quickstart

### 1. UI de Curación (HITL)
```bash
cd curator
npm install
npm run dev
# → http://localhost:5174
```

### 2. Generador Python
```bash
cd generator
pip install -r requirements.txt
python generate.py --count 1000 --output ../dataset/raw/batch_001.jsonl
```

## Formato del dataset

Cada línea del `.jsonl` es:
```json
{
  "id": "ds_00001",
  "prompt": "Revista de moda, 3 páginas, paleta oscura, tipografía Playfair + Inter",
  "jsx": "<project>...</project>",
  "metadata": { "archetype": "magazine_cover", "reward": { "total": 0.82, ... } },
  "curation": { "status": "pending", "approved_by": null, "notes": "", "tags": [] }
}
```
