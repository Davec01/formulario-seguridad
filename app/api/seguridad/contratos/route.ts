// app/api/seguridad/contratos/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type RawItem = {
  id: number;
  contrato: string;
  responsable: string;
  empleado: string;
  // el JSON puede tener mil campos más; estos nos bastan
};

function norm(s: unknown): string {
  return String(s ?? "").normalize("NFC").trim().toLowerCase();
}

export async function GET(req: NextRequest) {
  // Puedes consultar por “persona” (empleado) o por “responsable”
  const qResp = (req.nextUrl.searchParams.get("responsable") || "").trim();
  const qPersona = (req.nextUrl.searchParams.get("persona") || "").trim();

  if (!qResp && !qPersona) {
    return NextResponse.json(
      { error: "Se requiere 'responsable' o 'persona' en querystring" },
      { status: 400 }
    );
  }

  try {
    // OJO: este JSON es el del proyecto de seguridad
    const filePath = path.join(process.cwd(), "preoperacional.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { items?: RawItem[] };

    const items = parsed.items ?? [];
    const wantResp = norm(qResp);
    const wantPers = norm(qPersona);

    let universe: RawItem[] = [];

    if (qResp) {
      // filtra por responsable exacto (case-insensitive)
      universe = items.filter((it) => norm(it.responsable) === wantResp);
    }

    if (qPersona) {
      // 1) contratos donde la persona aparece como empleado
      const contratosDeLaPersona = new Set(
        items.filter((it) => norm(it.empleado) === wantPers).map((it) => it.contrato)
      );
      // 2) traer TODOS los ítems de esos contratos
      const allFromContracts = items.filter((it) =>
        contratosDeLaPersona.has(it.contrato)
      );
      // si además vino qResp, unimos; si no, usamos allFromContracts
      universe = qResp ? [...universe, ...allFromContracts] : allFromContracts;
    }

    if (!universe.length) {
      return NextResponse.json({
        responsable: qResp || null,
        persona: qPersona || null,
        contratos: [],
        message: "Sin coincidencias para el filtro indicado",
      });
    }

    // Agrupar por contrato y determinar el responsable “principal” del contrato
    const contratosMap = new Map<
      string,
      { contrato: string; responsablesCount: Map<string, number> }
    >();

    for (const it of universe) {
      const contrato = it.contrato || "(Sin contrato)";
      if (!contratosMap.has(contrato)) {
        contratosMap.set(contrato, { contrato, responsablesCount: new Map() });
      }
      const bucket = contratosMap.get(contrato)!;

      const resp = it.responsable?.trim();
      if (resp) {
        bucket.responsablesCount.set(resp, (bucket.responsablesCount.get(resp) || 0) + 1);
      }
    }

    // Construir salida: contrato + responsable (si consultaste por responsable, usamos ese; si no, el más frecuente)
    const contratos = Array.from(contratosMap.values())
      .map((c) => {
        let responsableContrato = qResp || null;
        if (!responsableContrato) {
          let best: string | null = null;
          let max = -1;
          for (const [name, count] of c.responsablesCount.entries()) {
            if (count > max) { max = count; best = name; }
          }
          responsableContrato = best;
        }
        return { contrato: c.contrato, responsable: responsableContrato ?? undefined };
      })
      .sort((a, b) => a.contrato.localeCompare(b.contrato));

    return NextResponse.json({
      responsable: qResp || null,
      persona: qPersona || null,
      contratos,
    });
  } catch (err) {
    console.error("Error leyendo preoperacional.json:", err);
    return NextResponse.json({ error: "No se pudo leer el JSON" }, { status: 500 });
  }
}
