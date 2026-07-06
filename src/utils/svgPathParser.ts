export interface BezierPoint {
  x: number;
  y: number;
  cmd: "M" | "L" | "C" | "Q" | "Z";
  c1?: { x: number; y: number };
  c2?: { x: number; y: number };
  qc?: { x: number; y: number };
}

export function parseSvgPath(d: string): BezierPoint[] {
  const points: BezierPoint[] = [];
  const re = /([MLQCZSTHVmlqczsthv])\s*([-\d.,eE\s]*)/g;
  let m: RegExpExecArray | null;
  let lastX = 0, lastY = 0;
  let startX = 0, startY = 0;

  while ((m = re.exec(d)) !== null) {
    const raw = m[1] as string;
    const isRel = raw === raw.toLowerCase();
    const cmd = raw.toUpperCase();
    const args = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    let i = 0;

    const rel = (v: number) => isRel ? v + lastX : v;
    const rely = (v: number) => isRel ? v + lastY : v;

    if (cmd === "M" && args.length >= 2) {
      startX = rel(args[i]); startY = rely(args[i + 1]); i += 2;
      points.push({ cmd: "M", x: startX, y: startY });
      lastX = startX; lastY = startY;
      if (args.length > 2) {
        while (i + 1 < args.length) {
          lastX = rel(args[i]); lastY = rely(args[i + 1]); i += 2;
          points.push({ cmd: "L", x: lastX, y: lastY });
        }
      }
    } else if (cmd === "L") {
      while (i + 1 < args.length) {
        lastX = rel(args[i]); lastY = rely(args[i + 1]); i += 2;
        points.push({ cmd: "L", x: lastX, y: lastY });
      }
    } else if (cmd === "H") {
      while (i < args.length) {
        lastX = rel(args[i]); i++;
        points.push({ cmd: "L", x: lastX, y: lastY });
      }
    } else if (cmd === "V") {
      while (i < args.length) {
        lastY = rely(args[i]); i++;
        points.push({ cmd: "L", x: lastX, y: lastY });
      }
    } else if (cmd === "C" && args.length >= 6) {
      while (i + 5 < args.length) {
        const c1x = rel(args[i]); const c1y = rely(args[i + 1]);
        const c2x = rel(args[i + 2]); const c2y = rely(args[i + 3]);
        lastX = rel(args[i + 4]); lastY = rely(args[i + 5]);
        points.push({ cmd: "C", x: lastX, y: lastY, c1: { x: c1x, y: c1y }, c2: { x: c2x, y: c2y } });
        i += 6;
      }
    } else if (cmd === "S") {
      while (i + 3 < args.length) {
        const prev = points[points.length - 1];
        let refX = lastX, refY = lastY;
        if (prev && prev.c2) {
          refX = lastX + (lastX - prev.c2.x);
          refY = lastY + (lastY - prev.c2.y);
        }
        const c2x = rel(args[i]); const c2y = rely(args[i + 1]);
        lastX = rel(args[i + 2]); lastY = rely(args[i + 3]);
        points.push({ cmd: "C", x: lastX, y: lastY, c1: { x: refX, y: refY }, c2: { x: c2x, y: c2y } });
        i += 4;
      }
    } else if (cmd === "Q" && args.length >= 4) {
      while (i + 3 < args.length) {
        const qcx = rel(args[i]); const qcy = rely(args[i + 1]);
        lastX = rel(args[i + 2]); lastY = rely(args[i + 3]);
        points.push({ cmd: "Q", x: lastX, y: lastY, qc: { x: qcx, y: qcy } });
        i += 4;
      }
    } else if (cmd === "T") {
      while (i + 1 < args.length) {
        const prev = points[points.length - 1];
        let refX = lastX, refY = lastY;
        if (prev && prev.qc) {
          refX = lastX + (lastX - prev.qc.x);
          refY = lastY + (lastY - prev.qc.y);
        }
        lastX = rel(args[i]); lastY = rely(args[i + 1]);
        points.push({ cmd: "Q", x: lastX, y: lastY, qc: { x: refX, y: refY } });
        i += 2;
      }
    } else if (cmd === "Z") {
      points.push({ cmd: "Z", x: lastX, y: lastY });
      lastX = startX; lastY = startY;
    }


  }

  return points;
}

export function serializeSvgPath(points: BezierPoint[]): string {
  return points.map((p) => {
    switch (p.cmd) {
      case "M": return `M${p.x} ${p.y}`;
      case "L": return `L${p.x} ${p.y}`;
      case "C": return `C${p.c1!.x} ${p.c1!.y} ${p.c2!.x} ${p.c2!.y} ${p.x} ${p.y}`;
      case "Q": return `Q${p.qc!.x} ${p.qc!.y} ${p.x} ${p.y}`;
      case "Z": return "Z";
    }
  }).join("");
}

export function getControlPoints(p: BezierPoint): { x: number; y: number }[] {
  const cps: { x: number; y: number }[] = [];
  if (p.c1) cps.push(p.c1);
  if (p.c2) cps.push(p.c2);
  if (p.qc) cps.push(p.qc);
  return cps;
}
