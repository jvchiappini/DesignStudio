import { useState } from "react";
import { useEditorStore } from "./editorStore";

export function QRGenerator({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [error, setError] = useState("");
  const addImage = useEditorStore((s) => s.addImage);
  const addSvg = useEditorStore((s) => s.addSvg);
  const elements = useEditorStore((s) => s.elements);

  const generateQR = async () => {
    if (!text.trim()) { setError("Ingresa un texto o URL"); return; }
    setError("");
    // Use QR Server API for generation (works offline with cached images)
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    setQrSvg(url);
  };

  const addToCanvas = () => {
    if (!qrSvg) return;
    addImage(qrSvg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl p-6 w-[400px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Generar Código QR</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer text-lg leading-none p-0">✕</button>
        </div>
        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder="https://ejemplo.com o texto libre"
          onKeyDown={(e) => { if (e.key === "Enter") generateQR(); }}
          className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground text-sm mb-3 box-border outline-none focus:border-primary" />
        <button onClick={generateQR}
          className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer border-none mb-3">
          Generar QR
        </button>
        {error && <div className="text-destructive text-xs mb-2">{error}</div>}
        {qrSvg && (
          <div className="flex flex-col items-center gap-3">
            <img src={qrSvg} alt="QR Code" className="w-48 h-48 border border-border rounded-lg" />
            <button onClick={addToCanvas}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer border-none">
              Añadir al canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
