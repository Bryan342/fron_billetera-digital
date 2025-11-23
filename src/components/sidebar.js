import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';

const logo = "https://cdn-icons-png.flaticon.com/512/2534/2534183.png"; 

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isHomeActive = location.pathname === '/home' || location.pathname === '/'; 

  const handleLogout = () => {
    if (window.confirm("¿Cerrar sesión en Luca?")) {
      localStorage.clear();
      navigate("/"); 
    }
  };

  return (
    <div className="sidebar-container">
      
      {/* HEADER: Logo y Título (Solo PC) */}
      <div className="sidebar-header">
        <img src={logo} alt="Logo Luca" className="sidebar-logo-img" /> 
        <h3 className="sidebar-title">Luca</h3>
      </div>

      {/* NAV: Menú Central */}
      <nav className="sidebar-nav">
        <ul className="nav-list">

          <li className={`nav-item ${isHomeActive ? 'active' : ''}`}>
            <Link to="/home" className="nav-link">
              <span className="icon">🏠</span> 
              <span className="link-text">Inicio</span>
            </Link>
          </li>

          <li className={`nav-item ${location.pathname === '/billetera' ? 'active' : ''}`}>
            <Link to="/billetera" className="nav-link">
              <span className="icon">💳</span> 
              <span className="link-text">Billetera</span>
            </Link>
          </li>

          <li className={`nav-item ${location.pathname === '/enviar' ? 'active' : ''}`}>
            <Link to="/enviar" className="nav-link">
              <span className="icon">✉️</span> 
              <span className="link-text">Enviar</span>
            </Link>
          </li>

          {/* BOTÓN SALIR (Solo Móvil) */}
          <li className="nav-item mobile-logout-btn" onClick={handleLogout}>
            <div className="nav-link" style={{ cursor: 'pointer' }}>
              <span className="icon" style={{color: '#ef4444'}}>🚪</span> 
              <span className="link-text" style={{color: '#ef4444'}}>Salir</span>
            </div>
          </li>

        </ul>
      </nav>

      {/* FOOTER: Botón Salir (Solo PC) */}
      <div className="sidebar-footer">
        <button className="btn-logout-desktop" onClick={handleLogout}>
          <span className="icon">🚪</span> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default Sidebar;