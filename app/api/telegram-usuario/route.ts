// app/api/telegram-usuario/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BOT_API_URL = "http://35.223.72.198:8000"; // URL del bot de Telegram

type TelegramUserResponse = {
  nombre: string | null;
  error?: string;
};

/**
 * Endpoint para validar el usuario de Telegram y obtener su nombre
 * Query params: telegram_id (number)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const telegramId = searchParams.get("telegram_id");

    if (!telegramId) {
      return NextResponse.json(
        { error: "Falta el parámetro telegram_id" },
        { status: 400 }
      );
    }

    // Consultar al bot de Telegram
    const response = await fetch(
      `${BOT_API_URL}/validar_usuario?telegram_id=${telegramId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error del bot de Telegram: ${response.status}` },
        { status: response.status }
      );
    }

    const data: TelegramUserResponse = await response.json();

    return NextResponse.json({
      success: true,
      nombre: data.nombre,
      telegram_id: telegramId,
    });
  } catch (error) {
    console.error("❌ Error al validar usuario de Telegram:", error);
    return NextResponse.json(
      { error: "Error al conectar con el bot de Telegram" },
      { status: 500 }
    );
  }
}
