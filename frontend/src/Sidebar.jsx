import { useNavigate } from "react-router-dom";

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const initials =
    user?.name
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Carlender</div>

      <nav className="sidebar-nav">
        <button className="nav-item active">Dashboard</button>
        <button className="nav-item">Fahrzeuge</button>
        <button className="nav-item">Kalender</button>
        <button className="nav-item">Profil</button>
      </nav>

      <button type="button" className="sidebar-user sidebar-user-button" onClick={() => navigate("/profile") }>
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.name || "Benutzer"}</div>
          <div className="user-email">{user?.email || "keine E-Mail"}</div>
        </div>
      </button>
    </aside>
  );
}
