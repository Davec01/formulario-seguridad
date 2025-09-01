// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider"; // ← esto sí puede quedar con alias si tu paths está OK

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Formulario de Verificación de Seguridad",
  description: "Sistema de verificación de seguridad para operadores de vehículos",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="es" className="light h-full">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
