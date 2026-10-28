# 012 – Usuarios sin email

**Estado:** Aprobada (2026-10-28)

## Objetivo
Que el personal entre al panel con un **usuario** (por ejemplo, `ncensi`) y una
contraseña que le asigna el encargado, sin usar emails. Reemplaza la invitación por
mail y "Olvidé mi contraseña" de la spec 004 (CA-12 y contraseña olvidada).

## Historias de usuario
- Como **encargado**, quiero **dar de alta a alguien con un usuario, una contraseña y
  un rol**, para que pueda entrar enseguida sin necesitar un email.
- Como **encargado**, quiero **cambiarle la contraseña a alguien** que se la olvidó.
- Como **vendedor o encargado**, quiero **entrar con mi usuario y mi contraseña**.

## Criterios de aceptación
### CA-1: Ingreso con usuario
- **Dado** la pantalla de ingreso al panel
- **Cuando** alguien escribe su usuario y su contraseña
- **Entonces** entra al panel. El usuario no distingue mayúsculas (`NCensi` es
  `ncensi`).
- Y si el usuario o la contraseña no son correctos, ve "Usuario o contraseña
  incorrectos." sin decir cuál de los dos falló.
- Y no se pide ni se muestra ningún email.

### CA-2: Alta de personal
- **Dado** el encargado en **Personal**
- **Cuando** da de alta a alguien con usuario, contraseña y rol (encargado o vendedor)
- **Entonces** la cuenta queda creada y esa persona ya puede entrar. No se manda
  ningún mail.
- Y el **usuario** tiene de 3 a 30 caracteres: letras sin tildes, números, punto,
  guion o guion bajo, y se guarda en minúsculas. No se puede repetir ("Ya existe el
  usuario ncensi.").
- Y la **contraseña** tiene al menos 4 caracteres.

### CA-3: Contraseñas
- **Dado** el encargado en **Personal**
- **Cuando** le cambia la contraseña a alguien (también a sí mismo)
- **Entonces** la nueva queda activa enseguida y la anterior deja de servir.
- Y nadie más puede cambiar contraseñas: no hay "Olvidé mi contraseña" ni "Cambiar mi
  contraseña". En la pantalla de ingreso, en lugar de "Olvidé mi contraseña" dice: "¿Te
  olvidaste la contraseña? Pedile al encargado que te la cambie."

### CA-4: Lista, roles y bajas
- **Dado** el encargado en **Personal**
- **Cuando** ve la lista
- **Entonces** ve el usuario y el rol de cada persona, y puede cambiar roles y dar de
  baja como hasta ahora (spec 004, CA-12): nadie se quita el rol de encargado ni se da
  de baja a sí mismo. Quien es dado de baja no puede volver a entrar.
- Y arriba del panel se ve el usuario de quien está adentro, en vez del email.

### CA-5: Cuentas que ya existen
- **Dado** las cuentas que hoy entran con email
- **Cuando** se aplica este cambio
- **Entonces** cada una pasa a entrar con lo que está antes de la @ como usuario
  (`rtineo@lehonor.com` → `rtineo`), con la misma contraseña que ya tiene.
- Y si dos cuentas quedaran con el mismo usuario, no se cambia ninguna y se avisa,
  para resolverlo a mano.

## Fuera de alcance
- Recuperar la contraseña sin el encargado.
- Que cada persona cambie su propia contraseña.
- Nombre y apellido de cada persona (solo usuario).
- Mails de cualquier tipo (invitación, recuperación, avisos).

## Decisiones tomadas en la revisión
- **Contraseña olvidada:** la cambia el encargado.
- **Cambiar la propia contraseña:** no; solo el encargado cambia contraseñas.
- **Cuentas existentes:** el usuario es lo que está antes de la @.
- **Largo mínimo de la contraseña:** 4 caracteres.
- **Nombre:** solo el usuario (sin nombre y apellido).

## Ideas para más adelante
- Bloquear el ingreso unos minutos después de varios intentos fallidos con el mismo
  usuario.
