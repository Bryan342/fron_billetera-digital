import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usuarioData from '../data/usuario.json';
import '../styles/login.css';
import logo from '../assets/logo.png';


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const usuario = usuarioData.usuario;
    if (email === usuario.email && password === usuario.password) {
      navigate('/home');
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <img src={logo} alt="Logo Luca" className="logo-luca" />
        <h2>Iniciar Sesión</h2>
        <p className="subtext">Acceso seguro a tu billetera Luca</p>

        <form onSubmit={handleLogin}>
          <label>Correo Electrónico</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Iniciar Sesión</button>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="register-prompt">
          <p>¿No tienes cuenta?</p>
          <a href="/registro">Crear Cuenta</a>
        </div>

        <p className="security-note">
          Tu billetera está protegida con encriptación de nivel bancario
        </p>
      </div>
    </div>
  );
}

export default Login;