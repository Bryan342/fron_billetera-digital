import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import '../styles/enviar.css';

function Enviar() {
  const [tipoDestino, setTipoDestino] = useState('luca');
  const [banco, setBanco] = useState('');
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const destino = tipoDestino === 'luca' ? 'usuario Luca' : `banco ${banco}`;
    alert(`Transferencia simulada a ${destino} (${telefono}) por $${monto}`);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="enviar-container">
        <h2>Enviar Dinero</h2>

        <form onSubmit={handleSubmit}>
          <label>Destino</label>
          <select value={tipoDestino} onChange={(e) => setTipoDestino(e.target.value)}>
            <option value="luca">Usuario Luca</option>
            <option value="banco">Otro Banco</option>
          </select>

          {tipoDestino === 'banco' && (
            <>
              <label>Selecciona el banco</label>
              <select value={banco} onChange={(e) => setBanco(e.target.value)} required>
                <option value="">-- Selecciona --</option>
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
                <option value="BBVA">BBVA</option>
                <option value="Interbank">Interbank</option>
                <option value="BCP">BCP</option>
              </select>
            </>
          )}

          <label>Teléfono del destinatario</label>
          <input
            type="text"
            placeholder="Ej. 987654321"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />

          <label>Monto a enviar</label>
          <input
            type="number"
            placeholder="Ej. 250.00"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />

          <label>Mensaje (opcional)</label>
          <input
            type="text"
            placeholder="Ej. Pago de servicios"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />

          <button type="submit">Confirmar Envío</button>
        </form>
      </div>
    </div>
  );
}

export default Enviar;