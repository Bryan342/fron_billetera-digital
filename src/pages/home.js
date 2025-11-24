import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import '../styles/home.css';

function Home() {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Usuario");
  
  // Dashboard Financiero
  const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0 });
  const [recentTxs, setRecentTxs] = useState([]);

  // DATOS FICTICIOS PARA EL CARRUSEL
  const promociones = [
    {
        id: 1,
        titulo: "Combo Bembos Royal",
        dscto: "30% OFF",
        img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60",
        color: "#ffe4e6", 
        textColor: "#be123c"
    },
    {
        id: 2,
        titulo: "Pizza Hut Familiar",
        dscto: "2x1",
        img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=60",
        color: "#ffedd5", 
        textColor: "#c2410c"
    },
    {
        id: 3,
        titulo: "Starbucks Café",
        dscto: "S/ 10.90",
        img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=60",
        color: "#d1fae5", 
        textColor: "#047857"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userDataStr = localStorage.getItem("userData");
        
        if (!token || !userDataStr) {
          navigate("/");
          return;
        }

        const userData = JSON.parse(userDataStr);
        const userId = userData.user_id;

        // 1. OBTENER ID DE BILLETERA
        const balanceRes = await fetch(`https://billetera-production.up.railway.app/api/v1/wallets/${userId}/balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let walletId = null;
        if (balanceRes.ok) {
          const balanceJson = await balanceRes.json();
          if (balanceJson.wallet_id) walletId = balanceJson.wallet_id;
        }

        // 2. OBTENER MOVIMIENTOS
        if (walletId) {
            const txRes = await fetch(`https://billetera-production.up.railway.app/api/v1/wallets/${walletId}/ledger-enriched`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (txRes.ok) {
                const txData = await txRes.json(); 
                setRecentTxs(txData.slice(0, 3));

                let totalIngresos = 0;
                let totalGastos = 0;

                txData.forEach(tx => {
                    const monto = parseFloat(tx.amount);
                    if (tx.type === 'CREDIT') totalIngresos += monto;
                    else if (tx.type === 'DEBIT') totalGastos += monto;
                });
                setResumen({ ingresos: totalIngresos, gastos: totalGastos });
            }
        }

        // 3. OBTENER NOMBRE REAL
        const userRes = await fetch(`https://userservicesanti.onrender.com/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
            const userJson = await userRes.json();
            if (userJson.phone) {
                const profileRes = await fetch(`https://userservicesanti.onrender.com/users/profile/phone/${userJson.phone}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profileJson = await profileRes.json();
                    localStorage.setItem("profileData", profileJson);
                    if (profileJson.fullname) {
                        const nombreCompleto = profileJson.fullname.split(" ")[2] || profileJson.fullname.split(" ")[0]; 
                        const nombreBonito = nombreCompleto.charAt(0).toUpperCase() + nombreCompleto.slice(1).toLowerCase();
                        setUserName(nombreBonito);
                    }
                }
            }
        }

      } catch (error) {
        console.error("Error cargando home:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="app-layout">
      <Sidebar />
      
      <main className="content-area">
        <div className="feed-container">
          
          {/* HEADER */}
          <header className="dashboard-header" style={{marginBottom: '10px'}}>
            {loading ? (
                <div className="skeleton-loader" style={{width: '200px', height: '30px'}}></div>
            ) : (
                <>
                    <h2>Hola, {userName} 👋</h2>
                    <p>Aquí tienes tus novedades de hoy</p>
                </>
            )}
          </header>

          {/* 1. CARRUSEL DE PROMOCIONES */}
          <div className="carousel-section">
            <h4 style={{margin: '0 0 10px 5px', color: '#64748b'}}>🔥 Promociones del día</h4>
            <div className="promo-carousel">
                {promociones.map((promo) => (
                    <div key={promo.id} className="promo-slide" style={{backgroundColor: promo.color}}>
                        <div className="promo-text">
                            <span className="promo-badge-mini" style={{color: promo.textColor, borderColor: promo.textColor}}>
                                {promo.dscto}
                            </span>
                            <h3 style={{color: '#1e293b'}}>{promo.titulo}</h3>
                            <button className="btn-claim" style={{backgroundColor: promo.textColor}}>Lo quiero</button>
                        </div>
                        <img src={promo.img} alt={promo.titulo} className="slide-img" />
                    </div>
                ))}
            </div>
          </div>

          {/* 2. RESUMEN FINANCIERO */}
          <div className="finance-summary-row">
             <div className="pro-card summary-item">
                <div className="summary-icon green">↓</div>
                <div>
                    <span className="summary-label">Ingresos</span>
                    <h4 className="summary-amount green">+ S/ {resumen.ingresos.toFixed(2)}</h4>
                </div>
             </div>
             <div className="pro-card summary-item">
                <div className="summary-icon red">↑</div>
                <div>
                    <span className="summary-label">Gastos</span>
                    <h4 className="summary-amount red">- S/ {resumen.gastos.toFixed(2)}</h4>
                </div>
             </div>
          </div>

          {/* 3. ÚLTIMOS MOVIMIENTOS */}
          <div className="pro-card">
            <div className="card-header-row">
              <div className="card-title">Últimos Movimientos</div>
              <Link to="/billetera" style={{textDecoration:'none', color:'#2563eb', fontSize:'0.9rem', fontWeight:'600'}}>Ver todo</Link>
            </div>
            
            <div className="update-list">
              {recentTxs.length === 0 && !loading && <p style={{color:'#94a3b8', textAlign:'center'}}>No hay movimientos recientes</p>}
              
              {recentTxs.map((tx, idx) => (
                  <div className="update-row" key={idx}>
                    <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                        <div className={`mini-icon ${tx.type === 'CREDIT' ? 'bg-green' : 'bg-red'}`}>
                            {tx.type === 'CREDIT' ? '↓' : '↑'}
                        </div>
                        <div>
                            <strong>{tx.counterparty_details?.fullname || "Transferencia"}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {new Date(tx.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <span className={`date-badge ${tx.type === 'CREDIT' ? 'text-green' : 'text-red'}`}>
                        {tx.type === 'CREDIT' ? '+' : '-'} S/ {parseFloat(tx.amount).toFixed(2)}
                    </span>
                  </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Home;