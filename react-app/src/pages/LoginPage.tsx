import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { auth } from "../services/auth";

interface FormState {
  sexo: string;
  edad: string;
  peso_kg: string;
  altura_cm: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ sexo: "", edad: "", peso_kg: "", altura_cm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = useMemo(() => {
    const edad = Number(form.edad);
    const peso = Number(form.peso_kg);
    const altura = Number(form.altura_cm);
    return !!form.sexo && edad >= 1 && edad <= 120 && peso >= 1 && peso <= 500 && altura >= 30 && altura <= 250;
  }, [form]);

  const mapSexo = (sexo: string) => ({ masculino: "M", femenino: "F", otro: "Otro" }[sexo] ?? sexo);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      setLoading(true);
      setError("");
      const participanteRes = await api.crearParticipante({
        edad: Number(form.edad),
        peso_kg: Number(form.peso_kg),
        altura_cm: Number(form.altura_cm),
        sexo: mapSexo(form.sexo),
        consentimiento_informado: true,
      }) as any;
      auth.setParticipante(participanteRes.data);

      const sesionRes = await api.iniciarSesion({
        participante_id: participanteRes.data.pk_participante,
        dispositivo: "web",
        navegador: navigator.userAgent,
        resolucion_pantalla: `${window.screen.width}x${window.screen.height}`,
      }) as any;
      auth.setSesion(sesionRes.data);
      navigate("/juego");
    } catch {
      setError("Error al iniciar sesión. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="picnic-overlay" />
      <div className="title-container">
        <h1 className="font-title font-title-watermelon">¡Sirve la mesa!</h1>
      </div>
      <div className="container">
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="peso_kg" className="font-text">Peso (kg):</label>
            <input id="peso_kg" type="number" className="font-text" value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="font-text">Sexo:</label>
            <div className="radio-group">
              {["masculino", "femenino", "otro"].map((sexo) => (
                <div className="radio-option" key={sexo}>
                  <input type="radio" id={sexo} value={sexo} checked={form.sexo === sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} />
                  <label htmlFor={sexo} className="font-text">{sexo[0].toUpperCase() + sexo.slice(1)}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="edad" className="font-text">Edad:</label>
            <input id="edad" type="number" className="font-text" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="altura_cm" className="font-text">Estatura (cm):</label>
            <input id="altura_cm" type="number" className="font-text" value={form.altura_cm} onChange={(e) => setForm({ ...form, altura_cm: e.target.value })} />
          </div>
          {error && <div className="error-alert">{error}</div>}
          <div className="button-container">
            <button type="submit" className="btn-continue font-text" disabled={loading || !isValid}>
              {loading ? "Cargando..." : "Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
