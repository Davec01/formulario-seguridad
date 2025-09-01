// app/page.tsx  (o app/seguridad/page.tsx)
"use client";

import { Suspense } from "react";
export const dynamic = "force-dynamic"; // evita el prerender en build

import { useState, useEffect } from "react";
import { Shield, User, Briefcase, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

type ApiContratosResp = {
  responsable: string | null;
  persona: string | null;
  contratos: Array<{ contrato: string; responsable?: string }>;
  message?: string;
};

type Valor = "conforme" | "no_conforme" | "";

/** Wrapper que aporta el Suspense */
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Cargando…</div>}>
      <FormularioSeguridadInner />
    </Suspense>
  );
}

/** Tu componente original, sin cambios de lógica, solo renombrado */
function FormularioSeguridadInner() {
  const [formData, setFormData] = useState({
    empleado: "",
    contrato: "",
    responsable: "",
    // Preguntas
    pregunta1: "" as Valor,
    pregunta2: "" as Valor,
    pregunta3: "" as Valor,
    pregunta4: "" as Valor,
    pregunta5: "" as Valor,
    pregunta6: "" as Valor,
    pregunta7: "" as Valor,
    observaciones: "",
  });

  const searchParams = useSearchParams();
  const telegramId = searchParams.get("telegram_id");

  const [loadingEmpleado, setLoadingEmpleado] = useState(true);
  const [loadingAuto, setLoadingAuto] = useState(false);

  // 1) Traer nombre (empleado) desde tu proxy a FastAPI
  useEffect(() => {
    if (!telegramId) return;
    setLoadingEmpleado(true);
    fetch(`/api/usuario?telegram_id=${encodeURIComponent(telegramId)}`)
      .then((res) => res.json())
      .then((data) => {
        const nombre = (data?.nombre || "").trim();
        if (nombre) {
          setFormData((fd) => ({ ...fd, empleado: nombre }));
        }
      })
      .catch((err) => console.error("❌ /api/usuario:", err))
      .finally(() => setLoadingEmpleado(false));
  }, [telegramId]);

  // 2) Con el empleado, autocompletar contrato y responsable
  useEffect(() => {
    if (loadingEmpleado) return;
    if (!formData.empleado) return;

    (async () => {
      try {
        setLoadingAuto(true);
        const r = await fetch(
          `/api/seguridad/contratos?persona=${encodeURIComponent(formData.empleado)}`
        );
        const j: ApiContratosResp = await r.json();

        if (Array.isArray(j.contratos) && j.contratos.length) {
          const c0 = j.contratos[0];
          setFormData((fd) => ({
            ...fd,
            contrato: c0.contrato || fd.contrato,
            responsable: c0.responsable || fd.responsable,
          }));
        } else {
          setFormData((fd) => ({ ...fd, contrato: "", responsable: "" }));
        }
      } catch (e) {
        console.error("❌ /api/seguridad/contratos:", e);
      } finally {
        setLoadingAuto(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingEmpleado, formData.empleado]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/guardar-seguridad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) alert("✅ Formulario enviado y guardado con éxito");
      else alert("❌ Error al guardar: " + result.error);
    } catch (error) {
      console.error("❌ Error al enviar:", error);
      alert("❌ Fallo al conectar con el servidor");
    }
  };

  // Helper
  const Pregunta = ({
    id,
    color,
    texto,
    value,
    onChange,
  }: {
    id: string;
    color: "blue" | "green" | "gray";
    texto: string;
    value: Valor;
    onChange: (v: Valor) => void;
  }) => {
    const bg =
      color === "blue" ? "bg-blue-50" : color === "green" ? "bg-green-50" : "bg-gray-50";
    const textColor =
      color === "blue" ? "text-blue-800" : color === "green" ? "text-green-800" : "text-gray-800";

    return (
      <div className={`${bg} p-4 rounded-lg`}>
        <Label className={`text-sm font-medium ${textColor}`}>{texto}</Label>
        <RadioGroup
          value={value}
          onValueChange={(v) => onChange(v as Valor)}
          className="flex space-x-4 mt-2"
        >
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md">
            <RadioGroupItem value="conforme" id={`${id}-conforme`} />
            <Label htmlFor={`${id}-conforme`}>Conforme</Label>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md">
            <RadioGroupItem value="no_conforme" id={`${id}-no`} />
            <Label htmlFor={`${id}-no`}>No conforme</Label>
          </div>
        </RadioGroup>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-700">ANÁLISIS SEGURO DE TRABAJO</h1>
          <p className="text-gray-600 mt-2">
            Complete todos los campos para verificar las condiciones de seguridad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Información del Personal */}
          <Card className="p-6 border-t-4 border-t-blue-500 shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-center mb-6 text-blue-700">
              Información del Personal
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" /> Empleado
                </Label>
                <Input className="mt-1" value={loadingEmpleado ? "Cargando…" : formData.empleado} readOnly />
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Contrato
                </Label>
                <Input className="mt-1" value={loadingAuto ? "Buscando…" : formData.contrato} readOnly />
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" /> Responsable
                </Label>
                <Input className="mt-1" value={loadingAuto ? "Buscando…" : formData.responsable} readOnly />
              </div>
            </div>

            {/* Imagen fantasma */}
            <div className="relative mt-10 pt-10 border-t border-gray-200">
              <div className="absolute w-full h-full flex items-center justify-center">
                <img src="/icono.png" alt="Icono personalizado" className="w-32 h-32 opacity-80" />
              </div>
              <div className="h-40" />
            </div>
          </Card>

          {/* Verificación de Seguridad */}
          <Card className="p-6 border-t-4 border-t-green-500 shadow-lg">
            <h2 className="text-xl font-bold text-center mb-6 text-green-700">
              Verificación de Seguridad
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <Pregunta
                  id="p1"
                  color="blue"
                  texto="¿LOS DOCUMENTOS COMO LICENCIA, AUTORIZACIONES Y DEMÁS DOCUMENTOS PARA LA OPERACIÓN DEL VEHÍCULO ESTÁN VIGENTES?"
                  value={formData.pregunta1}
                  onChange={(v) => handleChange("pregunta1", v)}
                />
                <Pregunta
                  id="p2"
                  color="green"
                  texto="¿DESCANSO ADECUADAMENTE?"
                  value={formData.pregunta2}
                  onChange={(v) => handleChange("pregunta2", v)}
                />
                <Pregunta
                  id="p3"
                  color="blue"
                  texto="¿ESTÁ EN CONDICIONES FÍSICAS Y PSICOLÓGICAS PARA LA EJECUCIÓN DE LA TAREA SIN FATIGA, TRASTORNO DEL SUEÑO, PROBLEMAS PERSONALES CRÍTICOS U OTRA CONDICIÓN DE SALUD QUE PONGA EN RIESGO SU INTEGRIDAD Y LA DE LOS DEMÁS EN LA VÍA?"
                  value={formData.pregunta3}
                  onChange={(v) => handleChange("pregunta3", v)}
                />
                <Pregunta
                  id="p4"
                  color="green"
                  texto="¿CUENTA CON LOS EPP (ELEMENTOS DE PROTECCIÓN PERSONAL) Y ESTÁN EN PERFECTAS CONDICIONES PARA CUMPLIR CON EL DESARROLLO DE LA OPERACIÓN?"
                  value={formData.pregunta4}
                  onChange={(v) => handleChange("pregunta4", v)}
                />
                <Pregunta
                  id="p5"
                  color="blue"
                  texto="¿CONOCE, IDENTIFICA LOS PELIGROS Y RIESGOS A LOS QUE SE ENCUENTRA EXPUESTO EN EL DESARROLLO DE SUS ACTIVIDADES Y APLICA LAS MEDIDAS DE INTERVENCIÓN ESTABLECIDAS PARA LA GESTIÓN DE CADA UNO DE ELLOS?"
                  value={formData.pregunta5}
                  onChange={(v) => handleChange("pregunta5", v)}
                />
                <Pregunta
                  id="p6"
                  color="green"
                  texto="USTED ES CONSIENTE QUE DEBE REALIZAR PAUSAS ACTIVAS Y CON MAYOR ÉNFASIS EN RECORRIDOS DE MÁS DE 2 HORAS DE CONDUCCIÓN?"
                  value={formData.pregunta6}
                  onChange={(v) => handleChange("pregunta6", v)}
                />
                <Pregunta
                  id="p7"
                  color="gray"
                  texto="¿CONOCE LOS PROCEDIMIENTOS A SEGUIR EN CASO DE ACCIDENTE DE TRÁNSITO Y ACCIDENTE LABORAL?"
                  value={formData.pregunta7}
                  onChange={(v) => handleChange("pregunta7", v)}
                />

                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="observaciones" className="text-sm font-medium text-gray-800">
                    OBSERVACIONES
                  </Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => handleChange("observaciones", e.target.value)}
                    className="mt-2 bg-white"
                    rows={4}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3">
                Enviar Formulario
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
