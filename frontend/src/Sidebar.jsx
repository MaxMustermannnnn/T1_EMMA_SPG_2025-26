export default function Sidebar({ user }) {
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

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.name || "Benutzer"}</div>
          <div className="user-email">{user?.email || "keine E-Mail"}</div>
        </div>
      </div>
    </aside>
  );
}
