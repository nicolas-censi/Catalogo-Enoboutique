import { describe, expect, it } from "vitest";
import { aEmailInterno, contrasenaInterna } from "@/lib/admin/usuario";
import { DOMINIO_INTERNO, contrasenaInterna as contrasenaInternaScript, planearUsuarios } from "../../scripts/usuarios-plan.mjs";

// Spec 012, CA-5: cuentas existentes → usuario (lo que está antes de la @).
describe("planearUsuarios", () => {
  it("usa el mismo dominio y la misma contraseña interna que la app", () => {
    expect(aEmailInterno("x")).toBe(`x@${DOMINIO_INTERNO}`);
    expect(contrasenaInternaScript("1234")).toBe(contrasenaInterna("1234"));
  });

  it("pasa cada email a su usuario, en minúsculas, y saltea las cuentas ya pasadas", () => {
    const plan = planearUsuarios([
      { id: "1", email: "RTineo@lehonor.com" },
      { id: "2", email: "ncensi@urbangroup.com.ar" },
      { id: "3", email: `vendedor@${DOMINIO_INTERNO}` },
    ]);
    expect(plan).toEqual({
      cambios: [
        { id: "1", email: "RTineo@lehonor.com", usuario: "rtineo" },
        { id: "2", email: "ncensi@urbangroup.com.ar", usuario: "ncensi" },
      ],
      problemas: [],
    });
  });

  it("si dos cuentas quedarían con el mismo usuario, o uno inválido, no cambia nada y lo avisa", () => {
    const plan = planearUsuarios([
      { id: "1", email: "ana@lehonor.com" },
      { id: "2", email: "ana@gmail.com" },
      { id: "3", email: `pedro@${DOMINIO_INTERNO}` },
      { id: "4", email: "pedro@lehonor.com" },
      { id: "5", email: "josé@lehonor.com" },
    ]);
    expect(plan.cambios).toEqual([]);
    expect(plan.problemas).toEqual([
      "ana: lo usarían ana@lehonor.com y ana@gmail.com.",
      "pedro: ya existe y lo usaría pedro@lehonor.com.",
      "josé@lehonor.com: «josé» no sirve como usuario (letras sin tildes, números, punto o guiones; de 3 a 30).",
    ]);
  });
});
