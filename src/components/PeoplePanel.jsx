import { useEffect, useState } from 'react';
import { ArrowLeft, Search, UserPlus, Check, Clock3, Users, LoaderCircle } from 'lucide-react';
import { friendlyError } from '../lib/helpers.js';

export default function PeoplePanel({ supabase, user, onBack, onOpenChat }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [tab, setTab] = useState('search');
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function refreshRequests() {
    const { data } = await supabase.from('friend_requests').select('id,sender_id,receiver_id,status,created_at,sender:profiles!friend_requests_sender_id_fkey(id,username,display_name,avatar_url)').eq('receiver_id',user.id).eq('status','pending').order('created_at',{ascending:false});
    setRequests(data||[]);
  }
  async function refreshFriends() {
    const { data } = await supabase.from('friendships').select('user_id,friend_id,friend:profiles!friendships_friend_id_fkey(id,username,display_name,avatar_url)').eq('user_id',user.id);
    setFriends(data||[]);
  }
  useEffect(()=>{ refreshRequests(); refreshFriends(); },[user.id]);
  useEffect(()=>{
    let active=true;
    const run=async()=>{
      const q=query.trim().replace(/^@/,'').toLowerCase();
      if(q.length<2){setResults([]);return;}
      const {data}=await supabase.from('profiles').select('id,username,display_name,avatar_url,is_online').ilike('username',`%${q}%`).neq('id',user.id).limit(20);
      if(active) setResults(data||[]);
    };
    const timer=setTimeout(run,250);
    return()=>{active=false;clearTimeout(timer)};
  },[query,user.id]);
  async function request(person) {
    setBusyId(person.id);setMessage('');
    try {
      const {error}=await supabase.from('friend_requests').insert({sender_id:user.id,receiver_id:person.id,status:'pending'});
      if(error) throw error;
      setMessage(`Solicitud enviada a @${person.username}.`);
    } catch(e){setMessage(friendlyError(e));}
    finally{setBusyId('');}
  }
  async function accept(req) {
    setBusyId(req.id);setMessage('');
    const {error}=await supabase.rpc('accept_friend_request',{request_id:req.id});
    if(error)setMessage(friendlyError(error)); else {await refreshRequests();await refreshFriends();}
    setBusyId('');
  }
  return <section className="subpage">
    <header className="subpage-header"><button className="icon-button" onClick={onBack}><ArrowLeft/></button><div><h2>Personas</h2><p>Encuentra tu comunidad</p></div></header>
    <div className="search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre de usuario..."/></div>
    <div className="segmented"><button className={tab==='search'?'selected':''} onClick={()=>setTab('search')}>Usuarios</button><button className={tab==='requests'?'selected':''} onClick={()=>setTab('requests')}>Solicitudes {requests.length>0&&<b>{requests.length}</b>}</button><button className={tab==='friends'?'selected':''} onClick={()=>setTab('friends')}>Contactos</button></div>
    {message&&<div className="notice">{message}</div>}
    {tab==='search' && (query.trim().length<2?<div className="empty-state"><Search size={30}/><h3>Busca a alguien</h3><p>Escribe al menos dos caracteres de su nombre de usuario.</p></div>:results.length===0?<div className="empty-state"><Users size={30}/><p>No encontramos usuarios con ese nombre.</p></div>:results.map(person=><div className="person-row" key={person.id}><div className="avatar">{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span>{(person.display_name||person.username).slice(0,1).toUpperCase()}</span>}</div><div className="person-info"><strong>{person.display_name||person.username}</strong><span>@{person.username}</span></div><button className="outline-button" disabled={busyId===person.id} onClick={()=>request(person)}>{busyId===person.id?<LoaderCircle className="spin" size={15}/>:<UserPlus size={15}/>} Agregar</button></div>))}
    {tab==='requests'&&(requests.length?requests.map(req=><div className="person-row" key={req.id}><div className="avatar"><span>{(req.sender?.username||'?').slice(0,1).toUpperCase()}</span></div><div className="person-info"><strong>{req.sender?.display_name||req.sender?.username}</strong><span>@{req.sender?.username}</span></div><button className="primary-button compact" disabled={busyId===req.id} onClick={()=>accept(req)}><Check size={15}/> Aceptar</button></div>):<div className="empty-state"><Clock3 size={30}/><p>No tienes solicitudes pendientes.</p></div>)}
    {tab==='friends'&&(friends.length?friends.map(item=><div className="person-row" key={item.friend_id}><div className="avatar"><span>{(item.friend?.username||'?').slice(0,1).toUpperCase()}</span></div><div className="person-info"><strong>{item.friend?.display_name||item.friend?.username}</strong><span>@{item.friend?.username}</span></div><button className="outline-button" onClick={()=>onOpenChat(item.friend)}>Ver chat</button></div>):<div className="empty-state"><Users size={30}/><p>Tus contactos aparecerán aquí cuando acepten una solicitud.</p></div>)}
  </section>;
}