import { useState } from 'react';
import { Bell, Camera, Plus, Search, Send, Users, Heart, MessageCircle, Compass } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Community({ profile, onFindPeople }) {
  const [post,setPost]=useState('');
  return <section className="community-page">
    <header className="topbar"><div className="brand"><Logo size={39}/><div><strong>LIDA</strong><small>Más que una app</small></div></div><div className="top-actions"><button className="icon-button" onClick={onFindPeople} aria-label="Buscar"><Search/></button><button className="icon-button" aria-label="Notificaciones" onClick={()=>alert('Las notificaciones push requieren configurar el proveedor y los permisos del dispositivo.')}><Bell/></button></div></header>
    <div className="community-banner glass"><Logo size={62}/><div><span className="eyebrow">BIENVENIDO A TU ESPACIO</span><h2>LIDA</h2><p>Más que una app, una comunidad.</p></div><span className="banner-glow"/></div>
    <form className="thought-box glass" onSubmit={e=>{e.preventDefault();alert('Para publicar contenido de forma persistente, configura la tabla posts y sus políticas RLS en Supabase.');setPost('')}}><div className="avatar mini"><span>{(profile?.display_name||profile?.username||'L').slice(0,1).toUpperCase()}</span></div><input value={post} onChange={e=>setPost(e.target.value)} placeholder="¿Qué estás pensando?"/><button type="button" className="icon-button" aria-label="Añadir foto"><Camera/></button><button className="send-button" aria-label="Publicar"><Send size={17}/></button></form>
    <div className="stories-heading"><strong>Historias</strong><button className="text-button" onClick={()=>alert('La subida y expiración de historias se activarán con Storage y la tabla stories.') }><Plus size={16}/> Añadir</button></div>
    <div className="stories-row"><button className="story-item" onClick={()=>alert('La cámara se abrirá cuando concedas permiso al dispositivo.')}><span className="story-ring add-story"><Plus/></span><small>Tu historia</small></button>{['Tu comunidad','Amigos','Descubrir'].map((s,i)=><div className="story-item" key={s}><span className="story-ring"><span>{['L','A','D'][i]}</span></span><small>{s}</small></div>)}</div>
    <div className="section-heading"><div><span className="eyebrow">TU COMUNIDAD</span><h2>Descubre</h2></div><button className="text-button" onClick={onFindPeople}>Buscar personas <Compass size={15}/></button></div>
    <div className="feature-card glass"><div className="feature-icon"><Users/></div><div><strong>Tu comunidad empieza aquí</strong><p>Encuentra personas, envía solicitudes y crea conversaciones reales.</p><button className="primary-button compact" onClick={onFindPeople}><Plus size={15}/> Encontrar personas</button></div></div>
    <div className="community-placeholder"><Logo size={52}/><p>Cuando sigas personas y se publiquen contenidos, aparecerán aquí.</p><span>Sin publicaciones de ejemplo</span></div>
  </section>;
}