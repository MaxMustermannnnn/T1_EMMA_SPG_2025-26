export default function Dashboard() {
  return (
    <div className="dashboard">
      <section className="dashboard-header">
        <h2>Willkommen zurück!</h2>
        <p>
          Hier ist eine Übersicht über Ihre Fahrzeuge und anstehende Termine.
        </p>
      </section>

      <section className="top-cards">
        <div className="card">
          <div className="card-title">Fahrzeuge</div>
          <div className="card-value">5</div>
          <div className="card-sub">Registrierte Fahrzeuge</div>
        </div>
        <div className="card">
          <div className="card-title">Anstehende Termine</div>
          <div className="card-value">1</div>
          <div className="card-sub">In den nächsten Wochen</div>
        </div>
        <div className="card">
          <div className="card-title">Dringend</div>
          <div className="card-value">0</div>
          <div className="card-sub">Nächste 7 Tage</div>
        </div>
        <div className="card">
          <div className="card-title">Überfällig</div>
          <div className="card-value">9</div>
          <div className="card-sub">Verpasste Termine</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Meine Fahrzeuge</h3>
            <span className="panel-sub">
              Ihre registrierten Fahrzeuge im Überblick
            </span>
          </div>

          <div className="vehicle-list">
            <div className="vehicle-item">
              <div className="vehicle-icon">🚗</div>
              <div className="vehicle-main">
                <div className="vehicle-name">BMW 3er</div>
                <div className="vehicle-plate">B-MK 1234</div>
              </div>
              <div className="vehicle-km">45 000 km</div>
            </div>

            <div className="vehicle-item">
              <div className="vehicle-icon">🚗</div>
              <div className="vehicle-main">
                <div className="vehicle-name">Audi A4</div>
                <div className="vehicle-plate">M-AB 5678</div>
              </div>
              <div className="vehicle-km">62 000 km</div>
            </div>

            <div className="vehicle-item">
              <div className="vehicle-icon">🚗</div>
              <div className="vehicle-main">
                <div className="vehicle-name">Mercedes-Benz C-Klasse</div>
                <div className="vehicle-plate">HH-CD 9012</div>
              </div>
              <div className="vehicle-km">28 000 km</div>
            </div>
          </div>

          <button className="panel-footer-button">
            Alle Fahrzeuge anzeigen
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Anstehende Termine</h3>
            <span className="panel-sub">
              Ihre nächsten Termine im Überblick
            </span>
          </div>

          <div className="appointment-card">
            <div className="appointment-header">
              <span className="appointment-title">
                Hauptuntersuchung (TÜV)
              </span>
              <span className="badge badge-danger">TÜV</span>
            </div>
            <div className="appointment-sub">
              Mercedes-Benz C-Klasse • HH-CD 9012
            </div>
            <div className="appointment-date">15. März 2026</div>
          </div>

          <button className="panel-footer-button">Zum Kalender</button>
        </div>
      </section>
    </div>
  );
}
