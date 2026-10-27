import { useState } from 'react';
import { Gamepad2, Swords, Grid2X2, Zap, Users, RotateCcw } from 'lucide-react';

export default function Games({ profile }) {
  const [cells,setCells]=useState(Array(9).fill(''));
  const [turn,setTurn]=useState('X');
  const winner=(()=>{const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(const [a,b,c] of lines)if(cells[a]&&cells[a]===cells[b]&&cells[a]===cells[c])return cells[a];return null})();
  function play(i){if(cells[i]||winner)return;const next=[...cells];next[i]=turn;setCells(next);setTurn(turn==='X'?'O':'X')}
  function reset(){setCells(Array(9).fill(''));setTurn('X')}
  return <section className="games-page">
    <header className="page-title"><span className="eyebrow">COMPITE Y DIVIÉRTETE</span><h1>Games <span className="neon-text">LIDA</span></h1><p>Desafíos rápidos en tu propio espacio.</p></header>
    <div className="game-hero glass"><div className="game-orbit"><Gamepad2 size={44}/></div><div><span className="eyebrow">HEAD TO HEAD</span><h2>¿Listo para el reto?</h2><p>Encuentra a otra persona y compite en partidas rápidas.</p></div><button className="primary-button" onClick={()=>alert('El emparejamiento 1v1 requiere una sala de juego en tiempo real y otro usuario conectado.')}><Swords size={17}/> Buscar rival</button></div>
    <h3 className="section-label">Juegos disponibles</h3>
    <div className="game-grid"><article className="game-tile glass"><div className="tile-icon"><Grid2X2/></div><strong>Tres en raya</strong><p>Un clásico para practicar estrategia.</p><span className="game-tag">LOCAL · DEMO FUNCIONAL</span></article><article className="game-tile glass"><div className="tile-icon"><Zap/></div><strong>Luz camina</strong><p>Reacciona rápido y sigue el patrón.</p><span className="game-tag">PRÓXIMAMENTE</span></article><article className="game-tile glass"><div className="tile-icon"><Users/></div><strong>Minas: verdad o reto</strong><p>Elige una casilla y descubre el desafío.</p><span className="game-tag">PRÓXIMAMENTE</span></article></div>
    <section className="tic-tac-toe glass"><div className="game-head"><div><span className="eyebrow">MINIJUEGO</span><h3>Tres en raya</h3></div><button className="icon-button" onClick={reset} aria-label="Reiniciar"><RotateCcw/></button></div><div className="tic-grid">{cells.map((cell,i)=><button key={i} className={cell?'filled':''} onClick={()=>play(i)}>{cell}</button>)}</div><p className="game-status">{winner?`¡Ganó ${winner}!`:cells.every(Boolean)?'Empate.':`Turno de ${turn}`}</p><button className="secondary-button" onClick={reset}>Reiniciar partida</button></section>
  </section>;
}