import { describe, expect, it } from "vitest";
import { aEmailInterno, contrasenaInterna, deEmailInterno, validarContrasena, validarUsuario } from "@/lib/admin/usuario";

describe("validarUsuario (CA-2)", () => {
  it("acepta letras, números, punto y guiones, y lo pasa a minúsculas", () => {
    expect(validarUsuario("  NCensi ")).toEqual({ usuario: "ncensi" });
    expect(validarUsuario("juan.perez_2-b")).toEqual({ usuario: "juan.perez_2-b" });
  });

  it("rechaza vacíos, cortos, largos, tildes, espacios y arrobas", () => {
    const error = "El usuario tiene de 3 a 30 caracteres: letras sin tildes, números, punto, guion o guion bajo.";
    for (const malo of ["", "ab", "a".repeat(31), "josé", "juan perez", "juan@lehonor"]) {
      expect(validarUsuario(malo), malo).toEqual({ error });
    }
  });
});

describe("validarContrasena (CA-2)", () => {
  it("pide al menos 4 caracteres", () => {
    expect(validarContrasena("abc")).toBe("La contraseña tiene que tener al menos 4 caracteres.");
    expect(validarContrasena("abcd")).toBeNull();
  });

  it("no acepta más de 60 caracteres", () => {
    expect(validarContrasena("a".repeat(61))).toBe("La contraseña puede tener hasta 60 caracteres.");
  });
});

describe("email y contraseña internos (CA-1)", () => {
  it("el usuario se guarda como un email interno que nunca recibe mails", () => {
    expect(aEmailInterno("ncensi")).toBe("ncensi@usuarios.enoboutique.invalid");
    expect(deEmailInterno("ncensi@usuarios.enoboutique.invalid")).toBe("ncensi");
  });

  it("de una cuenta vieja con email muestra lo que está antes de la @", () => {
    expect(deEmailInterno("rtineo@lehonor.com")).toBe("rtineo");
  });

  it("la contraseña interna llega al mínimo de Supabase (6) y es siempre la misma", () => {
    expect(contrasenaInterna("abcd").length).toBeGreaterThanOrEqual(6);
    expect(contrasenaInterna("abcd")).toBe(contrasenaInterna("abcd"));
    expect(contrasenaInterna("abcd")).not.toBe(contrasenaInterna("abce"));
  });
});
