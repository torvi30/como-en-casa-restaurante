import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Admin from "./pages/admin";
import Footer from "./components/footer.jsx";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin-privado-7821" element={<Admin />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;