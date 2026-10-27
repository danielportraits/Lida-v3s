import { useState } from 'react';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
const steps = [
  { title: 'Bienvenido a LIDA', text: 'Este es tu espacio personal para conectar, compartir y conversar. Te enseñaremos lo esencial.' },
  { title: 'Comunidad', text: 'Descubre publicaciones, historias, grupos y personas de la comunidad.' },
  { title: 'Mensajes', text: 'Busca personas, acepta solicitudes y conversa en tiempo real. Una cuenta nueva empieza sin chats ficticios.' },
  { title: 'Games', text: 'Encuentra juegos rápidos y, cuando haya otro jugador disponible, podrás retarlo.' },
  { title: 'Perfil y ajustes', text: 'Edita tu perfil, administra privacidad y notificaciones, y vuelve a iniciar este recorrido cuando quieras.' },
  { title: '¡Todo listo!', text: 'Puedes recorrer LIDA a tu ritmo. Los permisos de cámara, micrófono y notificaciones se pedirán cuando uses esas funciones.' }
];
export default function Tour({ onFinish }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  return <div className="tour-backdrop"><section className="tour-card glass" role="dialog" aria-modal="true" aria-label="Tour guiado">
    <button className="icon-button tour-close" onClick={onFinish} aria-label="Saltar recorrido"><X size={19}/></button>
    <div className="tour-mark"><span>{String(index+1).padStart(2,'0')}</span><i /></div>
    <div className="eyebrow">RECORRIDO GUIADO · {index+1} DE {steps.length}</div>
    <h2>{step.title}</h2><p className="muted">{step.text}</p>
    <div className="tour-dots">{steps.map((s,i)=><button key={s.title} aria-label={`Paso ${i+1}`} className={i===index?'active':''} onClick={()=>setIndex(i)}/>)}</div>
    <div className="tour-actions"><button className="secondary-button" disabled={index===0} onClick={()=>setIndex(index-1)}><ArrowLeft size={16}/> Anterior</button>{index<steps.length-1?<button className="primary-button" onClick={()=>setIndex(index+1)}>Siguiente <ArrowRight size={16}/></button>:<button className="primary-button" onClick={onFinish}>Empezar <Check size={16}/></button>}</div>
    <button className="text-button" onClick={onFinish}>Saltar recorrido</button>
  </section></div>;
}