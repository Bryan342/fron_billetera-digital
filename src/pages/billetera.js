import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/sidebar';
import { Wifi, ArrowDownCircle, ArrowUpCircle, CreditCard, Loader2 } from 'lucide-react';
import '../styles/billetera.css';

// --- CONFIGURACIÓN ---
const API_BASE = 'https://billetera-production.up.railway.app/api/v1/wallets';
const POLLING_INTERVAL = 5000; // Actualizar cada 5 segundos

function Billetera() {
  const [saldo, setSaldo] = useState(0.00);
  const [allTransactions, setAllTransactions] = useState([]); // Todos los datos crudos
  const [visibleTransactions, setVisibleTransactions] = useState([]); // Datos visibles según paginación
  const [visibleCount, setVisibleCount] = useState(10); // Cantidad a mostrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [holderName, setholderName] = useState("USUARIO REGISTRADO") 

  // Referencia para saber si el componente sigue montado (evita errores de memoria)
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async (isBackgroundRefresh = false) => {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem("userData"));
      const profileData = JSON.parse(localStorage.getItem("profileData"));

      if (profileData?.fullname) {
        setholderName(profileData.fullname);
      }

      if (!token || !userData) {
        window.location.href = '/';
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      try {
        // Solo mostramos el spinner de carga la primera vez.
        // En las actualizaciones automáticas (background) no bloqueamos la pantalla.
        if (!isBackgroundRefresh) setLoading(true);

        // 1. Obtener Balance y ID de Billetera
        const resBalance = await fetch(`${API_BASE}/${userData.user_id}/balance`, { headers });
        
        if (resBalance.status === 401) {
           localStorage.clear();
           window.location.href = '/';
           return;
        }
        if (!resBalance.ok) throw new Error("Error al sincronizar saldo");
        
        const dataBalance = await resBalance.json();
        
        if (isMounted.current) {
            setSaldo(parseFloat(dataBalance.balance || 0));
        }

        // 2. Obtener Historial Enriquecido
        const resLedger = await fetch(`${API_BASE}/${dataBalance.wallet_id}/ledger-enriched`, { headers });
        
        if (!resLedger.ok) throw new Error("Error obteniendo movimientos");
        
        const dataLedger = await resLedger.json();

        // Ordenar por fecha (más reciente primero)
        const sortedLedger = Array.isArray(dataLedger) ? dataLedger.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ) : [];

        if (isMounted.current) {
            setAllTransactions(sortedLedger);
            // Nota: visibleTransactions se actualiza automáticamente gracias al useEffect de abajo
        }

      } catch (err) {
        console.error(err);
        if (isMounted.current && !isBackgroundRefresh) {
            setError(err.message);
        }
      } finally {
        if (isMounted.current && !isBackgroundRefresh) {
            setLoading(false);
        }
      }
    };

    // 1. Llamada inicial inmediata
    fetchData(false);

    // 2. Configurar el intervalo para actualizar cada 5 seg
    const intervalo = setInterval(() => {
        fetchData(true); // true = actualización silenciosa
    }, POLLING_INTERVAL);

    // 3. Limpieza al salir
    return () => {
        isMounted.current = false;
        clearInterval(intervalo);
    };
  }, []);

  // Efecto para manejar la paginación y actualizaciones de datos
  useEffect(() => {
    if (allTransactions.length > 0) {
      // Mantenemos la cantidad que el usuario haya decidido ver (visibleCount)
      setVisibleTransactions(allTransactions.slice(0, visibleCount));
    }
  }, [visibleCount, allTransactions]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  // --- FORMATEADORES ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-PE', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) return (
    <div className="loading-container">
      <Loader2 className="spinner" size={48} />
      <p>Sincronizando billetera...</p>
    </div>
  );

  if (error) return <div className="error-screen">⚠️ {error}</div>;

  return (
    <div className="billetera-layout">
      {/* SIDEBAR FIJO */}
      <Sidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="billetera-content">
        
        <div className="content-wrapper">
          {/* 1. TARJETA VIRTUAL CSS */}
          <section className="card-section">
            <div className="virtual-card fade-in-up">
              <div className="card-bg"></div>
              <div className="card-top">
                <div className="card-chip">
                  <div className="chip-line"></div>
                  <div className="chip-line"></div>
                  <div className="chip-line"></div>
                  <div className="chip-line"></div>
                </div>
                <Wifi className="contactless-icon" size={28} />
              </div>
              <div className="card-body">
                <span className="card-label">Saldo Disponible</span>
                <h1 className="card-balance">{formatCurrency(saldo)}</h1>
              </div>
              <div className="card-footer">
                <div className="card-holder">
                  <span className="holder-label">Titular</span>
                  <span className="holder-name">{holderName}</span>
                </div>
                <div className="card-logo">
                  <div className="circle c1"></div>
                  <div className="circle c2"></div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. LISTA DE MOVIMIENTOS */}
          <section className="transactions-section fade-in-up delay-1">
            <h3 className="section-title">Últimos Movimientos</h3>
            
            {visibleTransactions.length > 0 ? (
              <div className="transactions-list">
                {visibleTransactions.map((tx) => {
                  const isDebit = tx.type === 'DEBIT';
                  const amountClass = isDebit ? 'amount-debit' : 'amount-credit';
                  const sign = isDebit ? '-' : '+';
                  const contactName = tx.counterparty_details?.fullname || 'Desconocido';
                  
                  return (
                    <div key={tx.ledger_id} className="transaction-item">
                      <div className="tx-left">
                        <div className={`avatar-circle ${isDebit ? 'bg-red' : 'bg-green'}`}>
                          {isDebit ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                        </div>
                        <div className="tx-info">
                          <p className="tx-name">{contactName}</p>
                          <p className="tx-date">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      
                      <div className="tx-right">
                        <span className={`tx-amount ${amountClass}`}>
                          {sign} {formatCurrency(tx.amount)}
                        </span>
                        {tx.counterparty_details?.phone && (
                          <span className="tx-phone">{tx.counterparty_details.phone}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <CreditCard size={48} className="text-gray" />
                <p>No hay movimientos recientes.</p>
              </div>
            )}

            {/* BOTÓN VER MÁS */}
            {visibleCount < allTransactions.length && (
              <button className="btn-load-more" onClick={handleLoadMore}>
                Ver más transacciones
              </button>
            )}
          </section>
        </div>

      </main>
    </div>
  );
}

export default Billetera;