import React from 'react';
import Sidebar from '../components/sidebar';
import usuarioData from '../data/usuario.json';
import '../styles/home.css';

function Home() {
  const usuario = usuarioData.usuario;
  const billetera = usuario.billetera;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="home-container">
        <h2 className="bienvenida">Hola, {usuario.nombre}</h2>
        <p className="subtext">Bienvenido a tu billetera Luca</p>

        <div className="saldo-box">
          <div className="saldo-header">
            <h3>Saldo Total</h3>
            <span className="wallet-label">Billetera Principal Luca</span>
          </div>
          <p className="saldo-monto">${billetera.saldo.toFixed(2)}</p>
          <div className="acciones">
            <button>+ Enviar</button>
            <button>+ Recibir</button>
            <button>Más opciones</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;