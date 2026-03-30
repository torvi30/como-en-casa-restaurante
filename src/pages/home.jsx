import { useMemo, useState } from "react";
import productsData from "../data/products";
import Navbar from "../components/navbar";
import Hero from "../components/hero";
import ProductCard from "../components/productCard";
import Cart from "../components/cart";
import CategoryFilter from "../components/categoryFilter";

function Home() {
  const [products] = useState(
    JSON.parse(localStorage.getItem("restaurant_products")) || productsData
  );

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    orderType: "domicilio",
    address: "",
    notes: "",
  });

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category))];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "Todos" || product.category === selectedCategory;

    const text =
      `${product.name} ${product.description} ${product.category}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (id) => {
    const index = cart.findIndex((item) => item.id === id);

    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart.splice(index, 1);
      setCart(updatedCart);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCustomerChange = (e) => {
    setCustomerData({
      ...customerData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Navbar />
      <Hero />

      <section className="menu-section" id="menu">
        <h2>Nuestro menú</h2>

        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar platos, bebidas o categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="results-info">
          {filteredProducts.length} producto(s) encontrado(s)
        </div>

        <div className="main-content">
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                />
              ))
            ) : (
              <p className="no-results">
                No encontramos productos con esa búsqueda.
              </p>
            )}
          </div>

          <Cart
            cart={cart}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            customerData={customerData}
            handleCustomerChange={handleCustomerChange}
          />
        </div>
      </section>
    </>
  );
}

export default Home;