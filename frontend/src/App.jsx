import { useState } from "react";
import Login from "./Login";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <div>
      <h1>Fahrzeug-Wartungsbuch</h1>
      <p>Du bist eingeloggt.</p>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          setToken(null);
        }}
      >
        Logout
      </button>
      {/* Hier später deine Fahrzeug-/Maintenance-Komponenten */}
    </div>
  );
}

export default App;
