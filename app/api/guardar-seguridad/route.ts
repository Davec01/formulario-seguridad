// app/api/guardar-seguridad/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type FormData = {
  // Datos del empleado (ya vienen con los nombres de Odoo)
  employee_id: number;
  email: string;
  contrato_id: number;
  immediate_boss_id: number;
  email_responsable: string;
  company_id: number;
  state: string;

  // Preguntas (conforme/no_conforme) - 9 en total
  documentos: string;
  descanso: string;
  condiciones: string;
  epp: string;
  peligros: string;
  pausas: string;
  procedimientos: string;
  aspectos: string;
  conservacion: string;

  observaciones: string;
  token: string; // Token dinámico del API
};

export async function POST(request: Request) {
  try {
    console.log("🔵 Recibiendo request en /api/guardar-seguridad");
    const data: FormData = await request.json();
    console.log("📥 Datos recibidos:", JSON.stringify(data, null, 2));

    // Mapear preguntas a valores conforme/no_conforme
    const mapValue = (val: string) => {
      if (val === "conforme" || val === "no_conforme") return val;
      return "conforme"; // Default
    };

    // Construir el payload para Odoo (los datos ya vienen con los nombres correctos)
    const odooPayload = {
      state: data.state || "conforme",
      employee_id: data.employee_id,
      email: data.email,
      contrato_id: data.contrato_id,
      immediate_boss_id: data.immediate_boss_id,
      email_responsable: data.email_responsable,
      company_id: data.company_id,

      documentos: mapValue(data.documentos),
      descanso: mapValue(data.descanso),
      condiciones: mapValue(data.condiciones),
      epp: mapValue(data.epp),
      peligros: mapValue(data.peligros),
      pausas: mapValue(data.pausas),
      procedimientos: mapValue(data.procedimientos),
      aspectos: mapValue(data.aspectos),
      conservacion: mapValue(data.conservacion),

      observaciones: data.observaciones || "",
    };

    console.log("📤 Enviando a Odoo:", JSON.stringify(odooPayload, null, 2));
    console.log("🔑 Token usado:", data.token);

    // Hacer POST a Odoo con autenticación Bearer
    const odooResponse = await fetch(
      "https://viacotur16-qa11-22388022.dev.odoo.com/api/ast/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.token}`,
        },
        body: JSON.stringify(odooPayload),
      }
    );

    console.log("📡 Status de Odoo:", odooResponse.status);
    console.log("📡 Headers de respuesta:", Object.fromEntries(odooResponse.headers.entries()));

    if (!odooResponse.ok) {
      const errorText = await odooResponse.text();
      console.error("❌ Error de Odoo:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Error del servidor Odoo: ${odooResponse.status} - ${errorText}`,
        },
        { status: odooResponse.status }
      );
    }

    const responseText = await odooResponse.text();
    console.log("📥 Respuesta RAW de Odoo:", responseText);

    let odooResult;
    try {
      odooResult = JSON.parse(responseText);
    } catch (e) {
      odooResult = { raw: responseText };
    }
    console.log("✅ Respuesta de Odoo (parsed):", odooResult);

    return NextResponse.json({
      success: true,
      data: odooResult,
    });
  } catch (error: any) {
    console.error("❌ Error al guardar en Odoo:", error);
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
