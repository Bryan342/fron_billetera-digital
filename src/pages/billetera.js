import React from 'react';
import Sidebar from '../components/sidebar';
import usuarioData from '../data/usuario.json'; 
import '../styles/billetera.css';

function Billetera() {
  const billetera = usuarioData.usuario.billetera;
  // Intenta leer las transacciones. Si es null o undefined, usa un array vacío.
  const transacciones = billetera.transacciones || []; 
  
  // Calculamos el número de transacciones
  const numTransacciones = transacciones.length;

  // Función para formatear el monto en la tabla
  const formatMonto = (monto) => {
    const absMonto = Math.abs(monto).toFixed(2);
    return monto > 0 ? `+${absMonto}` : `-${absMonto}`;
  };

  return (
    <div className="app-layout"> 
      <Sidebar />
      <div className="main-content-area">
        <div className="billetera-container">

          {/* Bloque: Tarjetas de Resumen */}
          <div className="summary-grid">
            
            {/* 1. Monto de Ahorros */}
            <div className="summary-card savings-card">
              <p className="card-title">Monto de Ahorros</p>
              <h3 className="card-value">${billetera.saldo.toFixed(2)}</h3>
              <p className="card-subtitle">Balance disponible</p>
            </div>

            {/* 2. Gastos Este Mes */}
            <div className="summary-card expenses-card">
              <p className="card-title">Gastos Este Mes</p>
              <h3 className="card-value">${billetera.gastosMes.toFixed(2)}</h3>
              <p className="card-subtitle">Últimos 30 días</p>
            </div>

            {/* 3. Ingresos Este Mes */}
            <div className="summary-card incomes-card">
              <p className="card-title">Ingresos Este Mes</p>
              <h3 className="card-value">${billetera.ingresosMes.toFixed(2)}</h3>
              <p className="card-subtitle">Últimos 30 días</p>
            </div>
            
          </div>
          
          {/* Bloque: Historial de Transacciones */}
          <div className="transactions-history-card">
            <div className="history-header">
              <h2>Historial de Transacciones</h2>
              <button className="btn-report">Descargar Reporte</button>
            </div>
            
            {/* RENDERIZADO CONDICIONAL DE LA TABLA */}
            {numTransacciones > 0 ? (
                <table className="tabla-transacciones">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Teléfono</th>
                      <th>Fecha</th>
                      <th className="text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacciones.map((txn, index) => (
                      <tr key={txn.id || index}>
                        {/* Celda de Descripción con Ícono */}
                        <td className="txn-description-cell">
                          <div className="txn-text-details">
                              <p className="txn-description-text">{txn.descripcion}</p>
                          </div>
                        </td>
                        
                        <td>{txn.contacto || txn.telefono || 'N/A'}</td>
                        <td>{txn.fecha}</td>
                        
                        {/* Celda de Monto */}
                        <td className={`txn-monto-cell text-right ${txn.monto < 0 ? 'negativo' : 'positivo'}`}>
                          {formatMonto(txn.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : (
                <p className="no-transactions-message">Aún no tienes transacciones registradas en Luca.</p>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default Billetera;