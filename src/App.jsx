import { useState } from "react";
import Home from "./pages/home";
import Admin from "./pages/admin";
import "./index.css";

function App() {
  const [view, setView] = useState("home");

  return (
    <div>
      <nav className="navbar">
        <div className="logo">Como En Casa</div>

        <div className="nav-links">
          <button onClick={() => setView("home")}>Inicio</button>
          <button onClick={() => setView("admin")}>Admin</button>
        </div>
      </nav>

      {view === "home" && <Home />}
      {view === "admin" && <Admin />}
    </div>
  );
}

export default App;