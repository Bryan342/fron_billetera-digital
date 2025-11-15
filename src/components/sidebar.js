import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
import logo from '../assets/logo.png';

function Sidebar() {
  const location = useLocation();
  const isHomeActive = location.pathname === '/home' || location.pathname === '/'; 

  return (
    <div className="sidebar-container">
      
      {/* Sección Superior: Logo y Título */}
      <div className="sidebar-header">
        <img src={logo} alt="Logo Luca" className="sidebar-logo-img" /> 
        <h3 className="sidebar-title">Luca</h3>
      </div>

      {/* Sección de Navegación Principal */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          
          {/* Ítem: Inicio */}
          <li className={`nav-item ${isHomeActive ? 'active' : ''}`}>
            <Link to="/home" className="nav-link">
              <span className="icon">🏠</span> 
              Inicio
            </Link>
          </li>

          {/* Ítem: Billetera */}
          <li className={`nav-item ${location.pathname === '/billetera' ? 'active' : ''}`}>
            <Link to="/billetera" className="nav-link">
              <span className="icon">💳</span> 
              Billetera
            </Link>
          </li>

          {/* Ítem: Enviar */}
          <li className={`nav-item ${location.pathname === '/enviar' ? 'active' : ''}`}>
            <Link to="/enviar" className="nav-link">
              <span className="icon">✉️</span> 
              Enviar
            </Link>
          </li>
        </ul>
      </nav>

      {/* Sección Inferior: Salir */}
      <div className="sidebar-footer">
        <div className="footer-box">
           <button className="btn-options">
               <span className="icon">⚙️</span>
           </button>
        </div>
        <button className="btn-logout">
          Salir
        </button>
      </div>
    </div>
  );
}

export default Sidebar;