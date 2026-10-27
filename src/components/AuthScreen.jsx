import { useState } from 'react';
import { Mail, LockKeyhole, AtSign, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import Logo from './Logo.jsx';
import { friendlyError } from '../lib/helpers.js';

export default function AuthScreen({ supabase, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) throw new Error('El usuario debe tener 3–24 caracteres: letras, números o guion bajo.');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: cleanUsername, display_name: cleanUsername } }
        });
        if (error) throw error;
        if (data.session) onAuthenticated(data.session);
        else setMessage('Cuenta creada. Revisa tu correo para confirmar la dirección y después inicia sesión.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onAuthenticated(data.session);
      }
    } catch (error) { setMessage(friendlyError(error)); }
    finally { setBusy(false); }
  }

  return <main className="auth-screen">
    <div className="auth-glow" />
    <section className="auth-card glass">
      <div className="auth-brand"><Logo size={78} /><div><h1>LIDA</h1><p>Más que una app, una comunidad.</p></div></div>
      <div className="eyebrow">TU ESPACIO DIGITAL</div>
      <h2>{mode === 'login' ? 'Qué bueno verte.' : 'Crea tu espacio.'}</h2>
      <p className="muted">{mode === 'login' ? 'Inicia sesión para volver a conectar.' : 'Regístrate para entrar a la comunidad LIDA.'}</p>
      <form onSubmit={submit} className="auth-form">
        <label className="field"><Mail size={18}/><input type="email" autoComplete="email" placeholder="Correo electrónico" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        {mode === 'signup' && <label className="field"><AtSign size={18}/><input placeholder="Nombre de usuario" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} minLength={3} maxLength={24} required /><span className="field-hint">único</span></label>}
        <label className="field"><LockKeyhole size={18}/><input type={showPassword?'text':'password'} placeholder="Contraseña" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required/><button type="button" className="icon-button tiny" aria-label="Mostrar contraseña" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></label>
        {message && <div className="notice">{message}</div>}
        <button className="primary-button wide" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:null}{mode==='login'?'Iniciar sesión':'Crear cuenta'}</button>
      </form>
      <p className="auth-switch">{mode==='login'?'¿Todavía no tienes cuenta?':'¿Ya tienes cuenta?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}}>{mode==='login'?'Regístrate':'Inicia sesión'}</button></p>
      <p className="microcopy"><LockKeyhole size={12}/> Tu cuenta es personal. No compartiremos conversaciones entre usuarios.</p>
    </section>
  </main>;
}