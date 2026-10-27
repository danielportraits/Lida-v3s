import { useState } from 'react';
import { Settings, Shield, Bell, Database, Globe, CircleHelp, LogOut, ChevronRight, Edit3, Camera } from 'lucide-react';
import Logo from './Logo.jsx';

const settings=[['Mi cuenta','Privacidad, seguridad, correo','shield'],['Notificaciones','Tonos, mensajes y grupos','bell'],['Almacenamiento y datos','Uso de red y archivos','database'],['Idioma','Español','globe'],['Ayuda','Centro de ayuda y contacto','help']];
const icons={shield:Shield,bell:Bell,database:Database,globe:Globe,help:CircleHelp};
export default function Profile({ user, profile, onSignOut, onRestartTour }) {
  const [editing,setEditing]=useState(false);
  const [displayName,setDisplayName]=useState(profile?.display_name||profile?.username||'');
  const [bio,setBio]=useState(profile?.bio||'La vida es mejor en comunidad.');
  async function save(){alert('La edición persistente del perfil necesita la política UPDATE de profiles configurada en Supabase.');setEditing(false);}
  return <section className="profile-page">
    <header className="topbar"><div className="brand"><Logo size={37}/><strong>Perfil</strong></div><button className="icon-button" onClick={()=>onRestartTour()} aria-label="Configuración"><Settings/></button></header>
    <div className="profile-hero">
      <div className="profile-avatar"><span>{(profile?.display_name||profile?.username||user.email||'L').slice(0,1).toUpperCase()}</span><button onClick={()=>alert('La subida de avatar se habilitará con el bucket privado de perfiles.')} aria-label="Cambiar foto"><Camera size={15}/></button></div>
      {editing?<input className="edit-input" value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={40}/>:<h2>{profile?.display_name||profile?.username||'Tu perfil'}</h2>}
      <span className="profile-handle">@{profile?.username||'usuario'}</span>
      {editing?<textarea className="edit-input" value={bio} onChange={e=>setBio(e.target.value)} maxLength={160}/>:<p>{profile?.bio||'La vida es mejor en comunidad.'}</p>}
      <button className="secondary-button profile-edit" onClick={()=>editing?save():setEditing(true)}><Edit3 size={15}/>{editing?'Guardar cambios':'Editar perfil'}</button>
    </div>
    <div className="profile-stats glass"><div><strong>—</strong><span>Publicaciones</span></div><div><strong>—</strong><span>Seguidores</span></div><div><strong>—</strong><span>Siguiendo</span></div></div>
    <div className="settings-list">{settings.map(([title,sub,key])=>{const Icon=icons[key];return <button className="setting-row" key={key} onClick={()=>alert(`${title}: las preferencias detalladas se configurarán en la siguiente fase.`)}><span className="setting-icon"><Icon/></span><span className="setting-copy"><strong>{title}</strong><small>{sub}</small></span><ChevronRight size={18}/></button>})}</div>
    <button className="secondary-button tour-restart" onClick={onRestartTour}>Volver a ver el tour guiado</button>
    <button className="logout-button" onClick={onSignOut}><LogOut size={17}/> Cerrar sesión</button>
    <p className="account-email">{user.email}</p>
  </section>;
}