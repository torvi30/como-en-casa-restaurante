import { useEffect, useState } from "react";

const DEFAULT_CREDS = {
  username: "admin",
  password: "1234",
};

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    // Inicializa credenciales si no existen
    const saved = JSON.parse(localStorage.getItem("restaurant_admin_creds"));
    if (!saved || !saved.username || !saved.password) {
      localStorage.setItem(
        "restaurant_admin_creds",
        JSON.stringify(DEFAULT_CREDS)
      );
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const creds =
      JSON.parse(localStorage.getItem("restaurant_admin_creds")) ||
      DEFAULT_CREDS;

    if (
      form.username === creds.username &&
      form.password === creds.password
    ) {
      localStorage.setItem("restaurant_admin_logged", "true");
      onLogin(true);
      setError("");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Ingreso Administrador</h2>
        <p>Accede al panel de control</p>

        <input
          type="text"
          name="username"
          placeholder="Usuario"
          value={form.username}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default AdminLogin;