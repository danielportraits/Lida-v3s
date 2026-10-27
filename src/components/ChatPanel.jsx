import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Send, Smile, Mic, LockKeyhole, Search, UserPlus, Pin, Image, FileText } from 'lucide-react';
import Logo from './Logo.jsx';
import { timeLabel } from '../lib/helpers.js';

export default function ChatPanel({ supabase, user, profile, conversation, onBack, onFindPeople }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const peer = conversation?.peer;
  useEffect(() => {
    if (!conversation?.id || !supabase) { setMessages([]); setLoading(false); return; }
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: true }).limit(300);
      if (alive) { if (!error) setMessages(data || []); setLoading(false); }
    };
    load();
    const channel = supabase.channel(`messages:${conversation.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, payload => {
      if (payload.eventType === 'INSERT') setMessages(old => old.some(m=>m.id===payload.new.id)?old:[...old,payload.new]);
    }).subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [conversation?.id, supabase]);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  async function send(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !conversation?.id) return;
    setDraft('');
    const { error } = await supabase.from('messages').insert({ conversation_id: conversation.id, sender_id: user.id, body, message_type: 'text' });
    if (error) { setDraft(body); alert(`No se pudo enviar el mensaje: ${error.message}`); }
  }
  async function attachment(e) {
    const file = e.target.files?.[0]; if (!file || !conversation?.id) return;
    const safeName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(safeName, file, { upsert: false });
    if (uploadError) { alert(`No se pudo subir el archivo. Configura el bucket chat-media: ${uploadError.message}`); return; }
    const { data } = supabase.storage.from('chat-media').getPublicUrl(safeName);
    const { error } = await supabase.from('messages').insert({ conversation_id: conversation.id, sender_id: user.id, body: file.name, media_url: data.publicUrl, message_type: file.type.startsWith('image/')?'image':'file' });
    if (error) alert(error.message);
    e.target.value = '';
  }
  if (!conversation) return <section className="empty-chat glass"><Logo size={82}/><h2>Tu espacio para conectar</h2><p className="muted">Cuando aceptes una solicitud o empieces una conversación, aparecerá aquí.</p><button className="primary-button" onClick={onFindPeople}><UserPlus size={17}/> Buscar personas</button></section>;
  return <section className="chat-panel">
    <header className="chat-header">
      <button className="icon-button back-button" onClick={onBack} aria-label="Volver"><ArrowLeft/></button>
      <div className="avatar small">{peer?.avatar_url?<img src={peer.avatar_url} alt=""/>:<span>{(peer?.display_name||peer?.username||'?').slice(0,1).toUpperCase()}</span>}</div>
      <div className="chat-peer"><strong>{peer?.display_name || peer?.username || 'Conversación'}</strong><span><i className="online-dot"/> {peer?.is_online?'en línea':'LIDA'}</span></div>
      <button className="icon-button" title="Llamada de video" onClick={()=>alert('La interfaz de llamada está preparada; para conectar llamadas reales configura WebRTC y STUN/TURN.')}><Video/></button>
      <button className="icon-button" title="Llamada de voz" onClick={()=>alert('Para completar llamadas reales, configura señalización WebRTC y STUN/TURN.')}><Phone/></button>
      <button className="icon-button" title="Más opciones" onClick={()=>alert('Los mensajes fijados se activarán cuando se configure la política y tabla de mensajes fijados.')}><MoreVertical/></button>
    </header>
    <div className="security-strip"><LockKeyhole size={13}/> Conversación privada · el cifrado E2EE debe configurarse antes de anunciarlo como activo</div>
    <div className="message-scroll">
      {!messages.length && !loading && <div className="chat-empty-state"><Logo size={50}/><span>Esta conversación está lista.</span><small>Envía el primer mensaje para comenzar.</small></div>}
      {messages.map(m=><div key={m.id} className={`message-row ${m.sender_id===user.id?'mine':'theirs'}`}><div className="bubble">{m.message_type==='image'&&m.media_url?<img className="message-image" src={m.media_url} alt={m.body}/>:m.message_type==='file'&&m.media_url?<a className="file-link" href={m.media_url} target="_blank" rel="noreferrer"><FileText size={18}/>{m.body}</a>:<p>{m.body}</p>}<time>{timeLabel(m.created_at)} {m.sender_id===user.id?'✓✓':''}</time></div></div>)}
      <div ref={bottomRef}/>
    </div>
    <form className="composer" onSubmit={send}>
      <button type="button" className="icon-button" title="Emojis" onClick={()=>setDraft(v=>v+'🙂')}><Smile/></button>
      <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Escribe un mensaje..." aria-label="Mensaje" />
      <label className="icon-button attach-button" title="Adjuntar imagen o archivo"><Paperclip/><input type="file" onChange={attachment} accept="image/*,.pdf,.doc,.docx,.txt" hidden/></label>
      {draft.trim()?<button className="send-button" aria-label="Enviar"><Send size={19}/></button>:<button type="button" className="send-button" title="Notas de voz (requiere implementación de grabación)" onClick={()=>alert('La grabación de voz se habilitará en la siguiente fase con MediaRecorder y almacenamiento privado.')}><Mic size={20}/></button>}
    </form>
  </section>;
}