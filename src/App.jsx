import { useEffect, useMemo, useState } from 'react';
import { Users, MessageCircle, Gamepad2, UserRound, Search, Plus, SlidersHorizontal, Star, UsersRound, LogOut, WifiOff, Settings2 } from 'lucide-react';
import { supabase, hasSupabaseConfig } from './lib/supabase.js';
import { friendlyError, timeLabel } from './lib/helpers.js';
import Logo from './components/Logo.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Tour from './components/Tour.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import PeoplePanel from './components/PeoplePanel.jsx';
import Community from './components/Community.jsx';
import Games from './components/Games.jsx';
import Profile from './components/Profile.jsx';

const tabs=[{id:'community',label:'Comunidad',Icon:Users},{id:'messages',label:'Mensajes',Icon:MessageCircle},{id:'games',label:'Games',Icon:Gamepad2},{id:'profile',label:'Perfil',Icon:UserRound}];

export default function App(){
  const [session,setSession]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [profile,setProfile]=useState(null);
  const [tab,setTab]=useState('community');
  const [subpage,setSubpage]=useState('');
  const [activeConversation,setActiveConversation]=useState(null);
  const [conversations,setConversations]=useState([]);
  const [filter,setFilter]=useState('Todos');
  const [query,setQuery]=useState('');
  const [tourOpen,setTourOpen]=useState(false);
  const [configError,setConfigError]=useState('');
  const user=session?.user;

  useEffect(()=>{
    if(!supabase){setAuthLoading(false);return;}
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAuthLoading(false);});
    return()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    if(!user||!supabase){setProfile(null);return;}
    let alive=true;
    const load=async()=>{
      const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();
      if(!alive)return;
      if(error){setConfigError(error.message);return;}
      if(data){setProfile(data);if(!localStorage.getItem(`lida-tour-${user.id}`))setTourOpen(true);}
      else {
        const username=user.user_metadata?.username||user.email?.split('@')[0]||`user_${user.id.slice(0,6)}`;
        const {data:created,error:createError}=await supabase.from('profiles').insert({id:user.id,username,display_name:user.user_metadata?.display_name||username}).select().single();
        if(!alive)return;
        if(!createError){setProfile(created);if(!localStorage.getItem(`lida-tour-${user.id}`))setTourOpen(true);}
        else setConfigError(`No se pudo cargar tu perfil. Revisa la migración SQL: ${createError.message}`);
      }
    };
    load();
    return()=>{alive=false;};
  },[user?.id]);
  useEffect(()=>{
    if(!user||!supabase)return;
    let alive=true;
    const load=async()=>{
      const {data:members,error}=await supabase.from('conversation_members').select('conversation_id,last_read_at,conversations(id,type,title,updated_at)').eq('user_id',user.id);
      if(error){setConfigError(error.message);return;}
      const ids=(members||[]).map(m=>m.conversation_id);
      if(!ids.length){if(alive)setConversations([]);return;}
      const {data:msgs}=await supabase.from('messages').select('id,conversation_id,body,created_at,sender_id').in('conversation_id',ids).order('created_at',{ascending:false}).limit(100);
      const peerIds=[];
      for(const m of members||[]) if(m.conversations?.type==='direct') peerIds.push(m.conversations.id);
      const result=await Promise.all((members||[]).map(async m=>{
        const conv=m.conversations;
        let peer=null;
        if(conv?.type==='direct'){
          const {data:other}=await supabase.from('conversation_members').select('user_id').eq('conversation_id',conv.id).neq('user_id',user.id).maybeSingle();
          if(other){const {data:p}=await supabase.from('profiles').select('id,username,display_name,avatar_url,is_online').eq('id',other.user_id).maybeSingle();peer=p;}
        }
        const last=(msgs||[]).find(x=>x.conversation_id===conv?.id);
        return {...conv,peer,last_message:last,unread:0};
      }));
      if(alive)setConversations(result.sort((a,b)=>new Date(b.updated_at||b.last_message?.created_at||0)-new Date(a.updated_at||a.last_message?.created_at||0)));
    };
    load();
    const channel=supabase.channel(`conversation-list:${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'messages'},()=>load()).on('postgres_changes',{event:'*',schema:'public',table:'conversation_members',filter:`user_id=eq.${user.id}`},()=>load()).subscribe();
    return()=>{alive=false;supabase.removeChannel(channel);};
  },[user?.id]);
  const filteredConversations=useMemo(()=>conversations.filter(c=>{
    if(filter==='Grupos'&&c.type!=='group')return false;
    if(filter==='Destacados'&&!c.is_favorite)return false;
    const name=c.peer?.display_name||c.peer?.username||c.title||'';
    return !query||name.toLowerCase().includes(query.toLowerCase());
  }),[conversations,filter,query]);

  async function signOut(){if(supabase)await supabase.auth.signOut();setSession(null);setProfile(null);setSubpage('');setActiveConversation(null);}
  function finishTour(){localStorage.setItem(`lida-tour-${user.id}`,'done');setTourOpen(false);}
  function openConversation(peer){
    if(!peer?.id)return;
    (async()=>{
      const {data,error}=await supabase.rpc('get_or_create_direct_conversation',{other_user_id:peer.id});
      if(error){alert(`No se pudo abrir el chat: ${friendlyError(error)}. Comprueba que instalaste supabase/schema.sql.`);return;}
      setActiveConversation({id:data, type:'direct', peer});
      setTab('messages');setSubpage('');
    })();
  }
  if(authLoading)return <div className="boot-screen"><Logo size={72}/><div className="loading-line"/><span>Preparando tu espacio...</span></div>;
  if(!hasSupabaseConfig)return <div className="setup-screen"><Logo size={80}/><span className="eyebrow">CONFIGURACIÓN INICIAL</span><h1>LIDA necesita conectarse</h1><p>La interfaz está preparada, pero todavía faltan las credenciales de tu proyecto Supabase. Copia <code>.env.example</code> como <code>.env</code>, añade la URL y la clave anon pública y ejecuta el SQL incluido.</p><div className="setup-steps"><span>01 · Crear proyecto Supabase</span><span>02 · Ejecutar supabase/schema.sql</span><span>03 · Configurar variables .env</span><span>04 · npm run dev</span></div></div>;
  if(!session)return <AuthScreen supabase={supabase} onAuthenticated={setSession}/>;

  return <div className="app-shell">
    <aside className="desktop-rail"><div className="rail-logo"><Logo size={38}/></div>{tabs.map(({id,label,Icon})=><button key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setSubpage('');setActiveConversation(null)}} title={label}><Icon/><span>{label}</span></button>)}<button className="rail-bottom" onClick={signOut} title="Cerrar sesión"><LogOut/></button></aside>
    <main className="app-main">
      {configError&&<div className="global-notice"><WifiOff size={16}/><span>{configError}</span><button onClick={()=>setConfigError('')}>×</button></div>}
      {subpage==='people'?<PeoplePanel supabase={supabase} user={user} onBack={()=>setSubpage('')} onOpenChat={openConversation}/>:subpage==='chat'&&activeConversation?<ChatPanel supabase={supabase} user={user} profile={profile} conversation={activeConversation} onBack={()=>{setSubpage('');setActiveConversation(null)}} onFindPeople={()=>setSubpage('people')}/>:tab==='community'?<Community profile={profile} onFindPeople={()=>setSubpage('people')}/>:tab==='messages'?<section className={`messages-page ${activeConversation?'has-chat':''}`}>
        <div className="conversation-list">
          <header className="topbar"><div className="brand"><Logo size={39}/><strong>LIDA</strong></div><div className="top-actions"><button className="icon-button" onClick={()=>setSubpage('people')} aria-label="Buscar usuarios"><Search/></button><button className="icon-button" onClick={()=>setSubpage('people')} aria-label="Añadir conversación"><Plus/></button></div></header>
          <div className="page-title messages-title"><span className="eyebrow">TU ESPACIO</span><h1>Mensajes</h1><p>Conecta. Comparte. Vive LIDA.</p></div>
          <label className="search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar conversaciones..."/></label>
          <div className="chat-filters">{['Todos','No leídos','Destacados','Grupos'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f==='Destacados'?<Star size={13}/>:f==='Grupos'?<UsersRound size={13}/>:null}{f}</button>)}</div>
          <div className="list-heading"><span>MENSAJES RECIENTES</span><button className="icon-button tiny" aria-label="Filtros" onClick={()=>setFilter(filter==='Todos'?'Grupos':'Todos')}><SlidersHorizontal size={16}/></button></div>
          {filteredConversations.length?filteredConversations.map(c=><button className={`conversation-row ${activeConversation?.id===c.id?'chosen':''}`} key={c.id} onClick={()=>{setActiveConversation(c);setSubpage('chat')}}><div className="avatar">{c.peer?.avatar_url?<img src={c.peer.avatar_url} alt=""/>:<span>{(c.peer?.display_name||c.peer?.username||c.title||'L').slice(0,1).toUpperCase()}</span>}</div><div className="conversation-copy"><strong>{c.peer?.display_name||c.peer?.username||c.title||'Grupo LIDA'}</strong><span>{c.last_message?.body||'Empieza una conversación'}</span></div><div className="conversation-meta"><time>{timeLabel(c.last_message?.created_at||c.updated_at)}</time>{c.unread>0&&<b>{c.unread}</b>}</div></button>):<div className="empty-list"><div className="empty-orb"><MessageCircle size={27}/></div><h3>Tu bandeja está vacía</h3><p>Cuando conectes con alguien, tus conversaciones aparecerán aquí.</p><button className="primary-button compact" onClick={()=>setSubpage('people')}><Plus size={15}/> Buscar personas</button></div>}
        </div>
        <div className="chat-area">{activeConversation?<ChatPanel supabase={supabase} user={user} profile={profile} conversation={activeConversation} onBack={()=>setActiveConversation(null)} onFindPeople={()=>setSubpage('people')}/>:<div className="desktop-chat-empty"><Logo size={78}/><h2>Conecta. Comparte. Vive LIDA.</h2><p>Selecciona una conversación o encuentra a alguien para empezar.</p><button className="secondary-button" onClick={()=>setSubpage('people')}><Search size={16}/> Buscar personas</button></div>}</div>
      </section>:tab==='games'?<Games profile={profile}/>:<Profile user={user} profile={profile} onSignOut={signOut} onRestartTour={()=>setTourOpen(true)}/>}
      <nav className="bottom-nav">{tabs.map(({id,label,Icon})=><button key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setSubpage('');if(id!=='messages')setActiveConversation(null)}}><Icon size={21}/><span>{label}</span>{id==='messages'&&conversations.length>0&&<i className="nav-dot"/>}</button>)}</nav>
    </main>
    {tourOpen&&<Tour onFinish={finishTour}/>}
  </div>;
}