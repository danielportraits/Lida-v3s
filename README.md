# LIDA — PWA React + Vite + Supabase

Base de proyecto modular para continuar el desarrollo de LIDA con estética negra y verde neón, basada en las referencias compartidas.

## Requisitos
- Node.js 20 LTS recomendado
- Proyecto Supabase
- npm

## Instalación local
1. Descomprime el ZIP.
2. Copia `.env.example` a `.env`.
3. Crea un proyecto en Supabase.
4. En Supabase → SQL Editor, ejecuta `supabase/schema.sql`.
5. Coloca `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env`. Usa la clave anon/publishable, nunca la `service_role`.
6. En Supabase Auth, configura URL de sitio y redirecciones. Decide si la confirmación por correo estará activada.
7. Ejecuta:

   ```bash
   npm install
   npm run dev
   ```

8. Para probar la compilación:

   ```bash
   npm run build
   npm run preview
   ```

## Logo
`public/lida-logo.png` contiene el archivo de logo proporcionado en esta conversación. Se utiliza sin redibujarlo como imagen en la cabecera, pantalla de acceso, favicon y metadatos PWA. Los iconos maskable deben revisarse para cumplir márgenes de seguridad antes de publicar.

## Estado de implementación honesto
Implementado en esta base:
- React/Vite, responsive shell y navegación inferior.
- Pantalla de acceso/registro conectada a Supabase Auth (requiere credenciales).
- Perfil de usuario y tour de primera entrada.
- Lista de chats vacía cuando no hay conversaciones; lectura y envío de mensajes de texto en una conversación existente.
- Búsqueda de usuarios, solicitudes entrantes y aceptación mediante RPC.
- RPC para crear/recuperar chats directos entre amistades.
- Adjuntos con Storage, sujeto a configuración segura del bucket.
- Realtime para mensajes en conversaciones.
- Tres en raya local funcional.
- PWA shell, manifest, service worker y archivo `_redirects`.

Aún NO está terminado y no debe anunciarse como funcional:
- Cifrado extremo a extremo (E2EE). La etiqueta de chat advierte expresamente que no está activo.
- Llamadas WebRTC de voz/vídeo, STUN/TURN y señalización de producción.
- Grabación y reproducción de notas de voz, bloqueo de grabación y velocidades.
- Historias/publicaciones persistentes, reacciones, comentarios y subida de contenido a comunidad.
- Juegos multijugador y emparejamiento real.
- Ajustes detallados, notificaciones push, presencia fiable, indicadores de escritura/lectura, mensajes fijados y gestión de grupos.
- Políticas Storage definitivas y pruebas de seguridad.

## Seguridad antes de publicar
- Revisa todas las políticas RLS con dos cuentas de prueba.
- Crea un bucket privado `chat-media` y usa URLs firmadas; no hagas públicos los archivos privados.
- La búsqueda de perfiles expone los campos de perfil seleccionados a usuarios autenticados. Limita campos y añade rate limiting/anti-spam antes de producción.
- Añade un flujo seguro de creación de perfil tras la confirmación de correo; el alta puede no crear sesión automáticamente cuando la confirmación está activada.
- No declares E2EE hasta implementar intercambio de claves y cifrado autenticado en el cliente, con diseño de recuperación de claves.
- Para WebRTC, configura STUN/TURN y señalización con controles de autorización.
- Añade pruebas automatizadas, manejo de errores y observabilidad antes de considerar la app lista para producción.

## Despliegue
### Netlify
- Publica el directorio `dist` tras ejecutar `npm run build`.
- `_redirects` contiene `/* /index.html 200`.
- Configura las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel de Netlify y vuelve a desplegar.

### GitHub Pages
`base: './'` permite rutas relativas a nivel de recursos, pero GitHub Pages no procesa `_redirects`. Para SPA con rutas profundas necesitarás un fallback compatible o mantener la app con navegación por estado/hash. Esta base usa navegación por estado, no rutas profundas.

## Nota
Este ZIP es una base de desarrollo integrada, no una afirmación de que todas las funciones sociales y de comunicación estén completas. Varias requieren configuración de servicios, políticas adicionales y pruebas reales.

## Publicar directamente desde GitHub (recomendado)

El repositorio incluye `.github/workflows/deploy.yml`: GitHub construye y publica la web automáticamente al subir cambios a `main` o `master`. No necesitas instalar Node.js en tu PC para publicar. Sigue los pasos de `GITHUB-PAGES.md`: sube el contenido de esta carpeta a la raíz del repositorio, activa **Settings → Pages → Source: GitHub Actions** y espera la ejecución de Actions.

Para que el registro, la búsqueda de usuarios y los chats funcionen con Supabase, configura las variables de repositorio `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en **Settings → Secrets and variables → Actions → Variables**, y vuelve a ejecutar el workflow. Sin ellas, la página puede publicarse, pero las funciones que dependen de Supabase no podrán conectarse. Nunca uses la clave `service_role` en el frontend.
