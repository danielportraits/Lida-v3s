export const initials = (name = '?') => name.trim().slice(0, 2).toUpperCase();
export const timeLabel = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-DO', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
};
export const friendlyError = (error) => {
  const message = error?.message || 'Ocurrió un error inesperado.';
  if (/Invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.';
  if (/User already registered/i.test(message)) return 'Ese correo ya tiene una cuenta.';
  if (/duplicate key|profiles_username_key/i.test(message)) return 'Ese nombre de usuario ya está ocupado.';
  return message;
};