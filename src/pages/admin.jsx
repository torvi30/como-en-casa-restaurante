import { useEffect, useMemo, useState } from "react";
import AdminLogin from "../components/adminLogin";
import productsData from "../data/products";

/** ===== Helpers de seguridad ===== */
function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function ensureArray(key) {
  const data = safeParse(key, []);
  if (!Array.isArray(data)) {
    localStorage.removeItem(key);
    return [];
  }
  return data;
}

function formatStatus(status) {
  if (status === "en_proceso") return "En proceso";
  if (status === "entregado") return "Entregado";
  return "Pendiente";
}

function Admin() {
  const [isLogged, setIsLogged] = useState(false);
  const [activeTab, setActiveTab] = useState("pedidos");

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
  });

  useEffect(() => {
    const logged = localStorage.getItem("restaurant_admin_logged") === "true";
    setIsLogged(logged);

    // Carga segura
    const savedOrders = ensureArray("restaurant_orders");
    setOrders(savedOrders);

    const savedProducts =
      safeParse("restaurant_products", null) || productsData;
    setProducts(Array.isArray(savedProducts) ? savedProducts : productsData);
  }, []);

  const saveOrders = (updated) => {
    setOrders(updated);
    localStorage.setItem("restaurant_orders", JSON.stringify(updated));
  };

  const saveProducts = (updated) => {
    setProducts(updated);
    localStorage.setItem("restaurant_products", JSON.stringify(updated));
  };

  const handleLogout = () => {
    localStorage.removeItem("restaurant_admin_logged");
    setIsLogged(false);
  };

  /** ===== Pedidos ===== */
  const deleteOrder = (id) => {
    if (!window.confirm("¿Eliminar pedido?")) return;
    const updated = orders.filter((o) => o.id !== id);
    saveOrders(updated);
    if (selectedOrder?.id === id) setSelectedOrder(null);
  };

  const updateOrderStatus = (id, status) => {
    const updated = orders.map((o) =>
      o.id === id ? { ...o, status } : o
    );
    saveOrders(updated);
    if (selectedOrder?.id === id) {
      setSelectedOrder(updated.find((o) => o.id === id) || null);
    }
  };

  const openWhatsApp = (order) => {
    const phone = (order.customer?.phone || "").replace(/\D/g, "");
    if (!phone) {
      alert("Este pedido no tiene teléfono.");
      return;
    }
    const msg = `Hola ${
      order.customer?.name || "cliente"
    }, tu pedido #${order.id} está ${formatStatus(
      order.status || "pendiente"
    )}.`;
    const url = `https://wa.me/57${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  /** ===== Productos ===== */
  const handleProductChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      price: "",
      category: "",
      image: "",
      description: "",
    });
    setEditingProductId(null);
  };

  const addOrUpdateProduct = (e) => {
    e.preventDefault();

    if (editingProductId) {
      const updated = products.map((p) =>
        p.id === editingProductId
          ? {
              ...p,
              name: productForm.name,
              price: Number(productForm.price),
              category: productForm.category,
              image: productForm.image,
              description: productForm.description,
            }
          : p
      );
      saveProducts(updated);
      resetProductForm();
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: productForm.name,
      price: Number(productForm.price),
      category: productForm.category,
      image: productForm.image,
      description: productForm.description,
    };

    saveProducts([...products, newProduct]);
    resetProductForm();
  };

  const editProduct = (p) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.image,
      description: p.description,
    });
    setActiveTab("productos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
    if (editingProductId === id) resetProductForm();
  };

  /** ===== Filtros ===== */
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const text = `
        ${o.customer?.name || ""}
        ${o.customer?.phone || ""}
        ${o.customer?.address || ""}
        ${o.customer?.notes || ""}
        ${o.items.map((i) => i.name).join(" ")}
      `.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [orders, search]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const text = `${p.name} ${p.category} ${p.description}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [products, search]);

  const customers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const phone = o.customer?.phone || `sin-${o.id}`;
      if (!map[phone]) {
        map[phone] = {
          name: o.customer?.name || "Sin nombre",
          phone: o.customer?.phone || "Sin teléfono",
          address: o.customer?.address || "",
          totalOrders: 0,
          totalSpent: 0,
        };
      }
      map[phone].totalOrders += 1;
      map[phone].totalSpent += o.total;
    });
    return Object.values(map);
  }, [orders]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((s, o) => s + o.total, 0);
    const totalOrders = orders.length;

    const counts = { pendiente: 0, en_proceso: 0, entregado: 0 };
    const productCounter = {};

    orders.forEach((o) => {
      const st = o.status || "pendiente";
      if (counts[st] !== undefined) counts[st]++;

      o.items.forEach((i) => {
        productCounter[i.name] = (productCounter[i.name] || 0) + i.quantity;
      });
    });

    let topProduct = "Sin datos",
      max = 0;
    for (const k in productCounter) {
      if (productCounter[k] > max) {
        max = productCounter[k];
        topProduct = k;
      }
    }

    return {
      totalSales,
      totalOrders,
      topProduct,
      pending: counts.pendiente,
      processing: counts.en_proceso,
      delivered: counts.entregado,
      totalCustomers: customers.length,
      totalProducts: products.length,
      averageTicket: totalOrders ? totalSales / totalOrders : 0,
      deliveredPercent: totalOrders
        ? Math.round((counts.entregado / totalOrders) * 100)
        : 0,
    };
  }, [orders, customers, products]);

  if (!isLogged) return <AdminLogin onLogin={setIsLogged} />;

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Panel Admin 📊</h1>
          <p>Pedidos, productos, clientes y métricas</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      <div className="admin-tabs">
        {["pedidos", "productos", "clientes", "metricas"].map((t) => (
          <button
            key={t}
            className={activeTab === t ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-search-box">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ===== PEDIDOS ===== */}
      {activeTab === "pedidos" && (
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">No hay pedidos</div>
          ) : (
            filteredOrders.map((o) => (
              <div
                key={o.id}
                className={`order-card status-${o.status || "pendiente"}`}
              >
                <div className="order-top">
                  <div>
                    <h3>Pedido #{o.id}</h3>
                    <p>{o.date}</p>
                  </div>
                  <span className={`status-badge status-${o.status || "pendiente"}`}>
                    {formatStatus(o.status || "pendiente")}
                  </span>
                </div>

                <div className="customer-info">
                  <p><b>Cliente:</b> {o.customer?.name || "-"}</p>
                  <p><b>Teléfono:</b> {o.customer?.phone || "-"}</p>
                  {o.customer?.address && (
                    <p><b>Dirección:</b> {o.customer.address}</p>
                  )}
                </div>

                <div className="order-items">
                  {o.items.map((i, idx) => (
                    <div className="order-item" key={idx}>
                      <span>{i.name} x{i.quantity}</span>
                      <strong>
                        ${(i.price * i.quantity).toLocaleString("es-CO")}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  Total: ${o.total.toLocaleString("es-CO")}
                </div>

                <div className="admin-order-buttons">
                  <button className="btn-view" onClick={() => setSelectedOrder(o)}>Ver</button>
                  <button className="btn-whatsapp" onClick={() => openWhatsApp(o)}>WhatsApp</button>
                  <button className="btn-process" onClick={() => updateOrderStatus(o.id, "en_proceso")}>Proceso</button>
                  <button className="btn-done" onClick={() => updateOrderStatus(o.id, "entregado")}>Entregado</button>
                  <button className="btn-delete" onClick={() => deleteOrder(o.id)}>Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== PRODUCTOS ===== */}
      {activeTab === "productos" && (
        <div className="products-admin-section">
          <form className="admin-form" onSubmit={addOrUpdateProduct}>
            <h2>{editingProductId ? "Editar producto" : "Agregar producto"}</h2>

            <input name="name" placeholder="Nombre" value={productForm.name} onChange={handleProductChange} required />
            <input name="price" type="number" placeholder="Precio" value={productForm.price} onChange={handleProductChange} required />
            <input name="category" placeholder="Categoría" value={productForm.category} onChange={handleProductChange} required />

            <input
              name="image"
              placeholder="URL de imagen (opcional)"
              value={productForm.image}
              onChange={handleProductChange}
            />

            <label className="upload-label">
              Subir imagen
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>

            {productForm.image && (
              <div className="image-preview-box">
                <img src={productForm.image} className="image-preview" />
              </div>
            )}

            <textarea
              name="description"
              placeholder="Descripción"
              value={productForm.description}
              onChange={handleProductChange}
              required
            />

            <div className="form-buttons">
              <button type="submit">
                {editingProductId ? "Actualizar" : "Guardar"}
              </button>
              {editingProductId && (
                <button type="button" className="btn-cancel" onClick={resetProductForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="admin-list">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-admin-card">
                <img src={p.image} className="product-admin-image" />
                <div>
                  <h4>{p.name}</h4>
                  <p>{p.category}</p>
                  <p>${p.price.toLocaleString("es-CO")}</p>
                </div>
                <div className="admin-item-actions">
                  <button className="btn-view" onClick={() => editProduct(p)}>Editar</button>
                  <button className="btn-delete" onClick={() => deleteProduct(p.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CLIENTES ===== */}
      {activeTab === "clientes" && (
        <div className="customers-section">
          {customers.map((c, i) => (
            <div key={i} className="customer-card">
              <h3>{c.name}</h3>
              <p>{c.phone}</p>
              <p>Pedidos: {c.totalOrders}</p>
              <p>Total: ${c.totalSpent.toLocaleString("es-CO")}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== MÉTRICAS ===== */}
      {activeTab === "metricas" && (
        <div className="dashboard-metrics">
          <div className="hero-metric-card sales">
            <div className="metric-icon">💰</div>
            <div>
              <span>Ventas</span>
              <strong>${stats.totalSales.toLocaleString("es-CO")}</strong>
            </div>
          </div>

          <div className="metrics-grid-pro">
            <div className="metric-pro-card">
              <span>Pedidos</span>
              <strong>{stats.totalOrders}</strong>
            </div>

            <div className="metric-pro-card">
              <span>Clientes</span>
              <strong>{stats.totalCustomers}</strong>
            </div>

            <div className="metric-pro-card">
              <span>Productos</span>
              <strong>{stats.totalProducts}</strong>
            </div>

            <div className="metric-pro-card">
              <span>Top</span>
              <strong>{stats.topProduct}</strong>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Pedido #{selectedOrder.id}</h2>
            {selectedOrder.items.map((i, idx) => (
              <div key={idx}>{i.name} x{i.quantity}</div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Admin;