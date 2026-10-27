# Despliegue y variables

- No subas `.env` al repositorio.
- En Netlify, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Site configuration → Environment variables.
- El build command es `npm run build`; publish directory `dist`.
- La clave `anon`/publishable puede usarse en el navegador con RLS correctamente configurado. Nunca uses la clave `service_role` en frontend.
- Las rutas de `vite.config.js` usan `base: './'`.
