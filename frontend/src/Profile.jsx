import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(0);

  const userName = localStorage.getItem("userName") || "Max Mustermann";
  
  const vehicles = [
    {
      marke: "Volkswagen",
      modell: "Golf 8",
      baujahr: "2023",
      kmStand: "45.230 km",
      kennzeichen: "WI-AB 1234",
      motor: "1.5 TSI",
      letztesService: "15.02.2026"
    },
    {
      marke: "BMW",
      modell: "3er 320i", 
      baujahr: "2023",
      kmStand: "28.920 km",
      kennzeichen: "WI-CD 5678",
      motor: "2.0 Turbo",
      letztesService: "05.02.2026"
    }
  ];

  const currentVehicle = vehicles[selectedVehicle];

  return (
    <div className="profile-page">
      <section className="profile-container">
        <header className="profile-header">
          <h1 className="profile-title">Fahrzeug-Profil</h1>
          <button onClick={() => navigate("/dashboard")} className="btn-back">
            ← Zurück zum Dashboard
          </button>
        </header>

        <div className="vehicle-card">
          <div className="owner-section">
            <div className="owner-avatar">{userName.charAt(0).toUpperCase()}</div>
            <div className="owner-info">
              <h2>{userName}</h2>
              <p>Fahrzeughalter</p>
            </div>
          </div>

          <div className="vehicle-tabs">
            {vehicles.map((vehicle, index) => (
              <div
                key={index}
                className={`tab-item ${index === selectedVehicle ? 'active' : ''}`}
                onClick={() => setSelectedVehicle(index)}
              >
                <span>{vehicle.marke}</span>
              </div>
            ))}
          </div>

          <div className="vehicle-details">
            <div className="detail-group">
              <h3>Fahrzeug</h3>
              <div className="vehicle-main">
                <p className="vehicle-name">{currentVehicle.marke} {currentVehicle.modell}</p>
                <p>{currentVehicle.baujahr} • {currentVehicle.kmStand}</p>
                <span className="license-plate">{currentVehicle.kennzeichen}</span>
              </div>
            </div>
            
            <div className="detail-group">
              <h3>Technik</h3>
              <div className="tech-info">
                <p>{currentVehicle.motor}</p>
                <p className="service-date">Letztes Service: {currentVehicle.letztesService}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="action-grid">
          <div className="action-card maintenance">
            <span className="icon">📅</span>
            <h3>Nächste Wartung</h3>
            <p>15.03.2026</p>
            <span>Planen →</span>
          </div>
          <div className="action-card service">
            <span className="icon">⚙️</span>
            <h3>Service-Historie</h3>
            <p>28 Einträge</p>
            <span>Anzeigen →</span>
          </div>
          <div className="action-card documents">
            <span className="icon">📄</span>
            <h3>Dokumente</h3>
            <p>12 Dateien</p>
            <span>Verwalten →</span>
          </div>
        </div>
      </section>
    </div>
  );
}
