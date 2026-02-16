import Sidebar from "./Sidebar";

export default function Layout({ children, onLogout, user }) {
  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <header className="app-header">
          <h1>Fahrzeug-Wartungsbuch</h1>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
