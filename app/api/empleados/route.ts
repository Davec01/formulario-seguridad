// app/api/empleados/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type EmpleadoAPI = {
  id: number;
  nombre: string;
  correo_laboral: string;
  responsable: string;
  monitor: string;
  contrato: string;
  compania: string;
  departamento: string;
  puesto_trabajo: string;
  codigo_pin: string;
};

type ApiResponse = {
  status: string;
  token: string;
  total_estimado: number;
  paginas_recorridas: number;
  items: EmpleadoAPI[];
};

export async function GET(req: NextRequest) {
  try {
    const response = await fetch("http://35.223.72.198:4001/empleados", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error del servidor externo: ${response.status}` },
        { status: response.status }
      );
    }

    const data: ApiResponse = await response.json();

    // Extraemos datos relevantes y retornamos el token también
    const empleados = data.items.map((emp) => ({
      id: emp.id,
      nombre: emp.nombre,
      email: emp.correo_laboral,
      responsable: emp.responsable,
      monitor: emp.monitor,
      contrato: emp.contrato,
      compania: emp.compania,
      departamento: emp.departamento,
      puesto_trabajo: emp.puesto_trabajo,
      codigo_pin: emp.codigo_pin || "",
    }));

    return NextResponse.json({
      success: true,
      token: data.token, // Token dinámico para usar en el POST
      empleados,
      total: data.total_estimado,
    });
  } catch (error) {
    console.error("❌ Error al obtener empleados:", error);
    return NextResponse.json(
      { error: "Error al conectar con el servidor de empleados" },
      { status: 500 }
    );
  }
}
