function Navbar({ setPage }) {
    return (
      <nav className="navbar">
        <div className="logo">Como En Casa</div>
  
        <div className="nav-links">
          <button onClick={() => setPage("home")}>Inicio</button>
          <button onClick={() => setPage("admin")}>Admin</button>
        </div>
      </nav>
    );
  }
  
  export default Navbar;