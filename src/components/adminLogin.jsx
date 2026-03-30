import { useState } from "react";

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ADMIN_USER = "admin";
  const ADMIN_PASS = "1234";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      onLogin(true);
      setError("");
    } else {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Panel Administrador</h2>
        <p>Ingresa para gestionar el sistema</p>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <span className="login-error">{error}</span>}

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default AdminLogin;