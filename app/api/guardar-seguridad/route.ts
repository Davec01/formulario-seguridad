import { NextResponse } from "next/server";
import { Pool } from "pg";

// 🔗 Conexión a tu Postgres del servidor
const pool = new Pool({
  user: "viacotur",                // o "admin"
  host: "34.174.97.159",           // no 'localhost' si está en otro host
  database: "viacotur",
  password: "viacotur_pass",       // o "P@ssw0rd"
  port: 5432,
});

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 👇 CAMBIO CLAVE: castear "" -> NULL y luego a ENUM
    const query = `
      INSERT INTO formulario_seguridad (
        empleado, contrato, responsable,
        pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, pregunta6, pregunta7,
        observaciones
      )
      VALUES (
        $1, $2, $3,
        NULLIF($4,'')::valor_conf,
        NULLIF($5,'')::valor_conf,
        NULLIF($6,'')::valor_conf,
        NULLIF($7,'')::valor_conf,
        NULLIF($8,'')::valor_conf,
        NULLIF($9,'')::valor_conf,
        NULLIF($10,'')::valor_conf,
        $11
      )
      RETURNING id
    `;

    const values = [
      data.empleado,
      data.contrato,
      data.responsable,
      data.pregunta1,
      data.pregunta2,
      data.pregunta3,
      data.pregunta4,
      data.pregunta5,
      data.pregunta6,
      data.pregunta7,
      data.observaciones,
    ];

    const { rows } = await pool.query(query, values);
    return NextResponse.json({ success: true, id: rows[0].id });
  } catch (error: any) {
    console.error("Error al guardar en PostgreSQL:", error);
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
