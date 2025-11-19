import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import '../styles/billetera.css';

// --- CONFIGURACIÓN ---
const API_URL = 'http://localhost:3001/api/v1/wallets';

// ⚠️ REEMPLAZA ESTOS VALORES CON LOS TUYOS ⚠️
const MY_USER_ID = "4";
const MY_WALLET_ID = 4;
//Ingresar token generado para este caso
const MY_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjM1MjQyMzgsImV4cCI6MTc2MzU1MzAzOH0.UkeTTf95AcBmjbRcTfrQXnWlDAhtrIqIzzkVDOizmDE";

function Billetera() {
  const [saldo, setSaldo] = useState(0.00);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MY_TOKEN}`
        };

        // Intentamos conectar con el backend real
        // Nota: Si esto falla, pasaremos al catch y usaremos datos demo
        const [resSaldo, resLedger] = await Promise.all([
          fetch(`${API_URL}/${MY_USER_ID}/balance`, { headers }),
          fetch(`${API_URL}/${MY_WALLET_ID}/ledger`, { headers })
        ]);

        if (!resSaldo.ok || !resLedger.ok) {
          throw new Error(`Error del servidor: ${resSaldo.status} / ${resLedger.status}`);
        }

        const dataSaldo = await resSaldo.json();
        const dataLedger = await resLedger.json();

        processData(dataSaldo, dataLedger);

      } catch (err) {
        console.error("Error de conexión:", err);

        // Guardas el error para usarlo en la interfaz
        setError("No se pudo conectar con el servidor. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processData = (dataSaldo, dataLedger) => {
    setSaldo(parseFloat(dataSaldo.balance || 0));

    const txnsFormateadas = Array.isArray(dataLedger) ? dataLedger.map(tx => {
      const isDebit = tx.type === 'DEBIT';
      const amountNum = parseFloat(tx.amount);

      return {
        id: tx.ledger_id,
        descripcion: tx.description || `Transacción ${tx.external_transaction_id || 'N/A'}`,
        contacto: 'Desconocido',
        telefono: 'N/A',
        fecha: tx.created_at ? new Date(tx.created_at).toLocaleDateString('es-PE', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Fecha inválida',
        monto: isDebit ? -amountNum : amountNum
      };
    }) : [];

    setTransacciones(txnsFormateadas);
  };

  // Función para formatear el monto en la tabla
  const formatMonto = (monto) => {
    const absMonto = Math.abs(monto).toFixed(2);
    return monto > 0 ? `+S/ ${absMonto}` : `-S/ ${absMonto}`;
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando tu billetera...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">{error}</p>
      </div>
    </div>
  );

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
              <h3 className="card-value">${saldo.toFixed(2)}</h3>
              <p className="card-subtitle">Balance disponible</p>
            </div>

            {/* 2. Gastos Este Mes */}
            {/* <div className="summary-card expenses-card">
              <p className="card-title">Gastos Este Mes</p>
              <h3 className="card-value">${billetera.gastosMes.toFixed(2)}</h3>
              <p className="card-subtitle">Últimos 30 días</p>
            </div> */}

            {/* 3. Ingresos Este Mes */}
            {/* <div className="summary-card incomes-card">
              <p className="card-title">Ingresos Este Mes</p>
              <h3 className="card-value">${billetera.ingresosMes.toFixed(2)}</h3>
              <p className="card-subtitle">Últimos 30 días</p>
            </div> */}

          </div>

          {/* Bloque: Historial de Transacciones */}
          <div className="transactions-history-card">
            <div className="history-header">
              <h2>Últimas transacciones</h2>
            </div>

            {/* RENDERIZADO CONDICIONAL DE LA TABLA */}
            {transacciones.length > 0 ? (
              <table className="tabla-transacciones">
                <thead>
                  <tr>
                    <th>ID Transacción</th>
                    <th>Contacto</th>
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