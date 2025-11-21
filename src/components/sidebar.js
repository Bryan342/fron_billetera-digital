import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';
import logo from '../assets/logo.png';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomeActive = location.pathname === '/home' || location.pathname === '/'; 

  const handleLogout = () => {
    localStorage.clear();

    navigate("/"); 
  };

  return (
    <div className="sidebar-container">
      
      <div className="sidebar-header">
        <img src={logo} alt="Logo Luca" className="sidebar-logo-img" /> 
        <h3 className="sidebar-title">Luca</h3>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">

          <li className={`nav-item ${isHomeActive ? 'active' : ''}`}>
            <Link to="/home" className="nav-link">
              <span className="icon">🏠</span> 
              Inicio
            </Link>
          </li>

          <li className={`nav-item ${location.pathname === '/billetera' ? 'active' : ''}`}>
            <Link to="/billetera" className="nav-link">
              <span className="icon">💳</span> 
              Billetera
            </Link>
          </li>

          <li className={`nav-item ${location.pathname === '/enviar' ? 'active' : ''}`}>
            <Link to="/enviar" className="nav-link">
              <span className="icon">✉️</span> 
              Enviar
            </Link>
          </li>

        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="footer-box">
          <button className="btn-options">
            <span className="icon">⚙️</span>
          </button>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          Salir
        </button>
      </div>
    </div>
  );
}

export default Sidebar;