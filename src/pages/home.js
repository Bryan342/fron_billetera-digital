import React from 'react';
import Sidebar from '../components/sidebar';
import usuarioData from '../data/usuario.json';
import '../styles/home.css';

function Home() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const usuario = userData.email.split("@")[0];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="home-container">
        <h2 className="bienvenida">Hola, {usuario}</h2>
        <p className="subtext">Bienvenid@ a tu billetera Luca</p>


      </div>
    </div>
  );
}

export default Home;