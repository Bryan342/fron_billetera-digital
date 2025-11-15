import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarUsuario } from '../services/api';
import '../styles/register.css';
import logo from '../assets/logo.png';

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!nombre || !email || !telefono || !dni || password.length < 8 || password !== confirmar) {
      setError('Verifica los campos y que las contraseñas coincidan');
      return;
    }

    const nuevoUsuario = {
      nombre,
      email,
      telefono,
      dni,
      password,
    };

    const res = await registrarUsuario(nuevoUsuario);
    if (res.success) {
      alert('Cuenta creada (simulada)');
      navigate('/');
    } else {
      setError('Error al registrar (simulado)');
    }
  };

  return (
    <div className="register-wrapper"> {/* Contenedor Principal */}
      <div className="register-box"> {/* Contenedor de la Tarjeta */}
        
        {/* LOGO Y TEXTOS */}
        <img src={logo} alt="Logo Luca" className="logo-luca" />
        <h2>Crear Cuenta</h2>
        <p className="subtext">Únete a Luca hoy</p>

        {/* FORMULARIO */}
        <form onSubmit={handleRegister}>
          
          {/* Nombre Completo */}
          <div className="form-group-register">
            <label>Nombre Completo</label>
            <input 
              type="text" 
              placeholder="Juan Pérez" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
            />
          </div>

          {/* Correo Electrónico */}
          <div className="form-group-register">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="tu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          {/* Teléfono */}
          <div className="form-group-register">
            <label>Teléfono</label>
            <input 
              type="text" 
              placeholder="3001234567" 
              value={telefono} 
              onChange={(e) => setTelefono(e.target.value)} 
            />
          </div>

          {/* DNI */}
          <div className="form-group-register">
            <label>DNI</label>
            <input 
              type="text" 
              placeholder="12345678" 
              value={dni} 
              onChange={(e) => setDni(e.target.value)} 
            />
          </div>

          {/* Contraseña */}
          <div className="form-group-register">
            <label>Contraseña</label>
            <input 
              type="password" 
              placeholder="********" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            {/* Nota de contraseña */}
            <p className="password-note">Mínimo 8 caracteres</p> 
          </div>

          {/* Confirmar Contraseña */}
          <div className="form-group-register">
            <label>Confirmar Contraseña</label>
            <input 
              type="password" 
              placeholder="********" 
              value={confirmar} 
              onChange={(e) => setConfirmar(e.target.value)} 
            />
          </div>

          {/* Botón Primario */}
          <button type="submit" className="btn-register-primary">
            Crear Cuenta
          </button>
        </form>

        {/* MENSAJES Y ENLACE DE LOGIN */}
        {error && <p className="error">{error}</p>}
        
        <div className="login-prompt">
          <p>¿Ya tienes cuenta?</p>
          {/* Usamos un botón para el estilo, aunque es un enlace de navegación */}
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="btn-register-secondary"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;