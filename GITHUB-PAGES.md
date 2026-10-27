# Publicar LIDA en GitHub Pages (sin instalar nada en tu PC)

## 1. Subir los archivos
1. Descarga y descomprime el ZIP del proyecto.
2. En GitHub crea un repositorio nuevo, por ejemplo `lida`.
3. Entra al repositorio y pulsa **Add file → Upload files**.
4. Sube el CONTENIDO de la carpeta `LIDA` (incluida la carpeta oculta `.github`). No subas la carpeta exterior envolviendo todo el proyecto: `package.json` debe quedar en la raíz del repositorio.
5. Pulsa **Commit changes**. La acción automática comenzará al subir los archivos a la rama `main` o `master`.

## 2. Activar Pages
1. En el repositorio entra a **Settings → Pages**.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**.
3. Abre la pestaña **Actions** y espera a que `Deploy LIDA to GitHub Pages` termine en verde.
4. El enlace público aparecerá en **Settings → Pages** y en el resumen de la ejecución de Actions. La primera publicación puede tardar unos minutos.

## 3. Conectar Supabase para cuentas y chats reales
La página puede compilar y publicarse sin estas variables, pero el registro, inicio de sesión, búsqueda de usuarios y mensajes que dependen de Supabase no funcionarán hasta configurarlas.

1. Crea/abre el proyecto en Supabase y ejecuta `supabase/schema.sql` en **SQL Editor**.
2. En GitHub abre **Settings → Secrets and variables → Actions → Variables** y crea estas variables de repositorio:
   - `VITE_SUPABASE_URL`: URL del proyecto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: clave pública `anon`/publishable del proyecto.
3. Vuelve a **Actions** y ejecuta manualmente `Deploy LIDA to GitHub Pages` con **Run workflow**, o sube un cambio para que se reconstruya.

Nunca pongas una clave `service_role` en variables `VITE_` ni en el frontend. Las variables `VITE_` se incorporan al JavaScript público; solo se debe usar la clave pública y proteger los datos con políticas RLS.

## Notas
- Este proyecto usa navegación interna por estado, no rutas profundas, y `base: './'` para que los recursos funcionen bajo la URL de un repositorio.
- GitHub Pages es alojamiento estático: no ejecuta un servidor Node.js permanente. Supabase aporta la autenticación y los servicios de backend.
- La publicación web no completa automáticamente funciones que aún requieren desarrollo, como llamadas WebRTC, cifrado E2EE, notas de voz e historias persistentes. Revisa `README.md` para conocer el estado real.
