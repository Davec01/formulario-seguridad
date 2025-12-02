// app/page.tsx
"use client";

export const dynamic = "force-dynamic"; // evita el prerender en build

import { useState, useEffect } from "react";
import { Shield, User, Briefcase, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Empleado = {
  id: number;
  nombre: string;
  email: string;
  responsable: string;
  monitor: string;
  contrato: string;
  compania: string;
  departamento: string;
  puesto_trabajo: string;
  codigo_pin: string;
};

type ApiEmpleadosResp = {
  success: boolean;
  token: string;
  empleados: Empleado[];
  total: number;
};

type Valor = "conforme" | "no_conforme" | "";

export default function FormularioSeguridad() {
  const [formData, setFormData] = useState({
    // Datos del empleado (para display)
    empleado: "",
    contrato: "",
    responsable: "",

    // Datos internos (IDs y emails para Odoo)
    empleado_id: 0,
    empleado_email: "",
    contrato_id: 0,
    responsable_id: 0,
    responsable_email: "",
    company_id: 0,

    // Preguntas (9 en total)
    documentos: "" as Valor,
    descanso: "" as Valor,
    condiciones: "" as Valor,
    epp: "" as Valor,
    peligros: "" as Valor,
    pausas: "" as Valor,
    procedimientos: "" as Valor,
    aspectos: "" as Valor,
    conservacion: "" as Valor,

    // Pregunta sobre medicamentos (si/no)
    medicamentos: "" as "si" | "no" | "",
    nombre_medicamento: "",

    observaciones: "",
  });

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [apiToken, setApiToken] = useState<string>("");
  const [telegramId, setTelegramId] = useState<string | null>(null);

  // 1) Capturar telegram_id de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("telegram_id");
    if (tid) {
      setTelegramId(tid);
      console.log("📱 Telegram ID detectado:", tid);
    }
  }, []);

  // 2) Cargar lista de empleados y token al montar el componente
  useEffect(() => {
    setLoadingEmpleados(true);
    fetch("/api/empleados")
      .then((res) => res.json())
      .then((data: ApiEmpleadosResp) => {
        if (data.success && Array.isArray(data.empleados)) {
          setEmpleados(data.empleados);
          setApiToken(data.token); // Guardar token dinámico
        }
      })
      .catch((err) => console.error("❌ /api/empleados:", err))
      .finally(() => setLoadingEmpleados(false));
  }, []);

  // 2) Cuando se selecciona un empleado, autocompletar todos los datos
  const handleEmpleadoChange = (empleadoNombre: string) => {
    const empleado = empleados.find((e) => e.nombre === empleadoNombre);
    if (empleado) {
      console.log("👤 Empleado seleccionado:", empleado);
      console.log("🔍 Buscando responsable:", empleado.responsable);

      // Buscar el responsable en la lista de empleados para obtener su ID y email
      const responsable = empleados.find((e) => e.nombre === empleado.responsable);

      if (responsable) {
        console.log("✅ Responsable encontrado:", responsable);
      } else {
        console.warn("⚠️ Responsable NO encontrado en la lista. Usando datos del empleado como fallback.");
      }

      setFormData((fd) => ({
        ...fd,
        // Datos para display
        empleado: empleado.nombre,
        contrato: empleado.contrato,
        responsable: empleado.responsable,

        // Datos para Odoo API
        empleado_id: empleado.id,
        empleado_email: empleado.email || "",
        contrato_id: 1, // Fijo
        responsable_id: responsable?.id || empleado.id, // Si no se encuentra, usar mismo empleado
        responsable_email: "prueba2@hotmail.com", // Email fijo para responsables
        company_id: 1, // Fijo - siempre usar company_id 1
      }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 3) Auto-llenar empleado cuando tenemos telegram_id y empleados
  useEffect(() => {
    if (!telegramId || empleados.length === 0 || formData.empleado) {
      return; // Ya tiene empleado seleccionado o falta info
    }

    console.log("🔍 Buscando empleado con codigo_pin =", telegramId);

    // Buscar empleado por codigo_pin
    const empleadoMatch = empleados.find(
      (emp) => emp.codigo_pin === telegramId
    );

    if (empleadoMatch) {
      console.log("✅ Empleado encontrado:", empleadoMatch.nombre);
      handleEmpleadoChange(empleadoMatch.nombre);
    } else {
      console.log("⚠️ No se encontró empleado con codigo_pin =", telegramId);
    }
  }, [telegramId, empleados, formData.empleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que se haya seleccionado un empleado
    if (!formData.empleado_id) {
      alert("⚠️ Por favor seleccione un empleado");
      return;
    }

    // Validar que todas las preguntas estén respondidas
    if (
      !formData.documentos ||
      !formData.descanso ||
      !formData.condiciones ||
      !formData.epp ||
      !formData.peligros ||
      !formData.pausas ||
      !formData.procedimientos ||
      !formData.aspectos ||
      !formData.conservacion ||
      !formData.medicamentos
    ) {
      alert("⚠️ Por favor responda todas las preguntas");
      return;
    }

    // Validar que si respondió "Si" a medicamentos, debe ingresar el nombre
    if (formData.medicamentos === "si" && !formData.nombre_medicamento.trim()) {
      alert("⚠️ Por favor indique el nombre del medicamento");
      return;
    }

    try {
      // Preparar datos en el formato que espera Odoo
      const payload = {
        state: "conforme", // Fijo según el ejemplo de Odoo
        employee_id: formData.empleado_id,
        email: formData.empleado_email,
        contrato_id: formData.contrato_id,
        immediate_boss_id: formData.responsable_id,
        email_responsable: formData.responsable_email,
        company_id: formData.company_id,

        // Todas las preguntas con sus valores
        documentos: formData.documentos,
        descanso: formData.descanso,
        condiciones: formData.condiciones,
        epp: formData.epp,
        peligros: formData.peligros,
        pausas: formData.pausas,
        procedimientos: formData.procedimientos,
        aspectos: formData.aspectos,
        conservacion: formData.conservacion,

        // Observaciones (incluyendo medicamentos si aplica)
        observaciones: formData.medicamentos === "si"
          ? `${formData.observaciones}\n\nMedicamento consumido: ${formData.nombre_medicamento}`.trim()
          : formData.observaciones,

        token: apiToken, // Token dinámico
      };

      console.log("📤 Enviando formulario:", payload);

      const response = await fetch("/api/guardar-seguridad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);
        alert(`❌ Error del servidor (${response.status}): ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log("✅ Resultado:", result);

      if (result.success) {
        alert("✅ Formulario enviado y guardado con éxito en Odoo");
        // Opcional: resetear formulario
        window.location.reload();
      } else {
        alert("❌ Error al guardar: " + result.error);
      }
    } catch (error) {
      console.error("❌ Error al enviar:", error);
      alert("❌ Fallo al conectar con el servidor: " + String(error));
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
          value={value || undefined}
          onValueChange={(v) => onChange(v as Valor)}
          className="flex space-x-4 mt-2"
        >
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md">
            <RadioGroupItem value="conforme" id={`${id}-conforme`} />
            <Label htmlFor={`${id}-conforme`} className="cursor-pointer">Conforme</Label>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md">
            <RadioGroupItem value="no_conforme" id={`${id}-no`} />
            <Label htmlFor={`${id}-no`} className="cursor-pointer">No conforme</Label>
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
                <Select
                  value={formData.empleado}
                  onValueChange={handleEmpleadoChange}
                  disabled={loadingEmpleados}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loadingEmpleados ? "Cargando empleados..." : "Seleccione un empleado"} />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map((emp) => (
                      <SelectItem key={emp.id} value={emp.nombre}>
                        {emp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Contrato
                </Label>
                <Input className="mt-1" value={formData.contrato} readOnly />
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" /> Responsable
                </Label>
                <Input className="mt-1" value={formData.responsable} readOnly />
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
                  id="documentos"
                  color="blue"
                  texto="¿LOS DOCUMENTOS COMO LICENCIA, AUTORIZACIONES Y DEMÁS DOCUMENTOS PARA LA OPERACIÓN DEL VEHÍCULO ESTÁN VIGENTES?"
                  value={formData.documentos}
                  onChange={(v) => handleChange("documentos", v)}
                />
                <Pregunta
                  id="descanso"
                  color="green"
                  texto="¿DESCANSO ADECUADAMENTE?"
                  value={formData.descanso}
                  onChange={(v) => handleChange("descanso", v)}
                />
                <Pregunta
                  id="condiciones"
                  color="blue"
                  texto="¿ESTÁ EN CONDICIONES FÍSICAS Y PSICOLÓGICAS PARA LA EJECUCIÓN DE LA TAREA SIN FATIGA, TRASTORNO DEL SUEÑO, PROBLEMAS PERSONALES CRÍTICOS U OTRA CONDICIÓN DE SALUD QUE PONGA EN RIESGO SU INTEGRIDAD Y LA DE LOS DEMÁS EN LA VÍA?"
                  value={formData.condiciones}
                  onChange={(v) => handleChange("condiciones", v)}
                />
                <Pregunta
                  id="epp"
                  color="green"
                  texto="¿CUENTA CON LOS EPP (ELEMENTOS DE PROTECCIÓN PERSONAL) Y ESTÁN EN PERFECTAS CONDICIONES PARA CUMPLIR CON EL DESARROLLO DE LA OPERACIÓN?"
                  value={formData.epp}
                  onChange={(v) => handleChange("epp", v)}
                />
                <Pregunta
                  id="peligros"
                  color="blue"
                  texto="¿CONOCE, IDENTIFICA LOS PELIGROS Y RIESGOS A LOS QUE SE ENCUENTRA EXPUESTO EN EL DESARROLLO DE SUS ACTIVIDADES Y APLICA LAS MEDIDAS DE INTERVENCIÓN ESTABLECIDAS PARA LA GESTIÓN DE CADA UNO DE ELLOS?"
                  value={formData.peligros}
                  onChange={(v) => handleChange("peligros", v)}
                />
                <Pregunta
                  id="pausas"
                  color="green"
                  texto="¿USTED ES CONSIENTE QUE DEBE REALIZAR PAUSAS ACTIVAS Y CON MAYOR ÉNFASIS EN RECORRIDOS DE MÁS DE 2 HORAS DE CONDUCCIÓN?"
                  value={formData.pausas}
                  onChange={(v) => handleChange("pausas", v)}
                />
                <Pregunta
                  id="procedimientos"
                  color="blue"
                  texto="¿CONOCE LOS PROCEDIMIENTOS A SEGUIR EN CASO DE ACCIDENTE DE TRÁNSITO Y ACCIDENTE LABORAL?"
                  value={formData.procedimientos}
                  onChange={(v) => handleChange("procedimientos", v)}
                />
                <Pregunta
                  id="aspectos"
                  color="green"
                  texto="¿CONOCE, IDENTIFICA LOS ASPECTOS E IMPACTOS AMBIENTALES QUE SE ENCUENTRAN PRESENTES EN EL DESARROLLO DE SUS ACTIVIDADES Y APLICA LAS MEDIDAS DE CONTROL ESTABLECIDAS PARA EL CONTROL DE CADA UNO DE ELLOS?"
                  value={formData.aspectos}
                  onChange={(v) => handleChange("aspectos", v)}
                />
                <Pregunta
                  id="conservacion"
                  color="blue"
                  texto="¿ES CONSCIENTE DE LA CONSERVACIÓN DEL MEDIO AMBIENTE Y LOS RECURSOS NATURALES, SIGUIENDO LAS RECOMENDACIONES ESTABLECIDAS EN LOS PROGRAMAS DEL SISTEMA DE GESTIÓN AMBIENTAL?"
                  value={formData.conservacion}
                  onChange={(v) => handleChange("conservacion", v)}
                />

                {/* Pregunta sobre medicamentos (Si/No) */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-yellow-800">
                    ¿HA CONSUMIDO MEDICAMENTOS QUE PUEDAN GENERAR SOMNOLENCIA, DISMINUCIÓN DE REFLEJOS U OTROS EFECTOS SECUNDARIOS QUE AFECTEN LA SEGURIDAD EN LA OPERACIÓN? EN CASO DE AFIRMATIVO, INDIQUE EL NOMBRE DEL MEDICAMENTO.
                  </Label>
                  <RadioGroup
                    value={formData.medicamentos || undefined}
                    onValueChange={(v) => handleChange("medicamentos", v)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md">
                      <RadioGroupItem value="si" id="medicamentos-si" />
                      <Label htmlFor="medicamentos-si" className="cursor-pointer">Sí</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md">
                      <RadioGroupItem value="no" id="medicamentos-no" />
                      <Label htmlFor="medicamentos-no" className="cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>

                  {formData.medicamentos === "si" && (
                    <div className="mt-4">
                      <Label htmlFor="nombre_medicamento" className="text-sm font-medium text-yellow-800">
                        NOMBRE DEL MEDICAMENTO (SI LA RESPUESTA ES SI)
                      </Label>
                      <Input
                        id="nombre_medicamento"
                        value={formData.nombre_medicamento}
                        onChange={(e) => handleChange("nombre_medicamento", e.target.value)}
                        className="mt-2 bg-white"
                        placeholder="Especifique el medicamento consumido"
                      />
                    </div>
                  )}
                </div>

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
