// import { NextRequest, NextResponse } from 'next/server'
// import { Pool } from 'pg'

// // ────────────────────────────────────────────────────────────────────────────
// // Configuración de PostgreSQL
// // ────────────────────────────────────────────────────────────────────────────
// const pool = new Pool({
//   user: 'viacotur',
//   host: 'localhost',
//   database: 'viacotur',
//   password: 'viacotur_pass',
//   port: 5432,
// })

// // ────────────────────────────────────────────────────────────────────────────
// // GET /api/usuario?telegramId=123456
// // ────────────────────────────────────────────────────────────────────────────
// export async function GET(req: NextRequest) {
//   try {
//     const id = req.nextUrl.searchParams.get('telegramId')

//     console.log("📩 ID recibido por query:", id)

//     if (!id) {
//       console.warn("⚠️ No se proporcionó telegramId")
//       return NextResponse.json({ error: 'telegramId requerido' }, { status: 400 })
//     }

//     const res = await pool.query(
//       `SELECT nombre FROM usuarios_registrados WHERE telegram_id = $1`,
//       [id]
//     )

//     const nombre = res.rows[0]?.nombre ?? null

//     console.log("🧾 Resultado de la consulta:", nombre)

//     return NextResponse.json({ nombre })

//   } catch (error) {
//     console.error("❌ Error en la consulta de usuario:", error)
//     return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
//   }
// }
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get("telegram_id")

  if (!telegramId) {
    return NextResponse.json({ error: "telegram_id requerido" }, { status: 400 })
  }

  try {
    const res = await fetch(`http://35.223.72.198:8000/validar_usuario?telegram_id=${telegramId}`)
    const data = await res.json()

    // ✅ Ahora SÍ devuelves la respuesta al frontend
    return NextResponse.json(data)

  } catch (error) {
    console.error("❌ Error comunicando con FastAPI:", error)
    return NextResponse.json({ error: "Error comunicando con FastAPI" }, { status: 500 })
  }
}


