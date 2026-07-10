import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Reset global styles inline — no external CSS needed
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #app { width: 100%; height: 100%; }
  body { background: #0b0b16; color: #fff; font-family: Inter, sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  button:disabled { opacity: 0.35; cursor: not-allowed !important; }
  select option { background: #1a1a2e; }
`;
document.head.appendChild(style);

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
