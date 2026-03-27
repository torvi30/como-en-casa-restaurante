import { useMemo, useState } from "react";
import AdminLogin from "../components/adminLogin";
import productsData from "../data/products";
import Swal from "sweetalert2";
import Highcharts from "highcharts";
import HighchartsReactModule from "highcharts-react-official";

const HighchartsReact =
  typeof HighchartsReactModule === "function"
    ? HighchartsReactModule
    : HighchartsReactModule?.default;

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

function orderTypeLabel(orderType) {
  if (orderType === "recogen") return "Para llevar";
  if (orderType === "comen-alla") return "Comer acá";
  return "Domicilio";
}

function getOrderDate(order) {
  if (typeof order?.createdAt === "number") return new Date(order.createdAt);
  if (typeof order?.id === "number") return new Date(order.id);
  if (order?.date) {
    const d = new Date(order.date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function Admin() {
  const [isLogged, setIsLogged] = useState(false);
  const [activeTab, setActiveTab] = useState("pedidos");

  const [orders, setOrders] = useState(
    ensureArray("restaurant_orders").sort((a, b) => b.id - a.id)
  );

  const [products, setProducts] = useState(() => {
    const savedProducts = safeParse("restaurant_products", null);
    return Array.isArray(savedProducts) ? savedProducts : productsData;
  });

  const [customersManual, setCustomersManual] = useState(() => {
    const savedCustomers = safeParse("restaurant_customers", []);
    return Array.isArray(savedCustomers) ? savedCustomers : [];
  });

  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [invoiceDraft, setInvoiceDraft] = useState(null);

  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const saveOrders = (updatedOrders) => {
    const ordered = [...updatedOrders].sort((a, b) => b.id - a.id);
    setOrders(ordered);
    localStorage.setItem("restaurant_orders", JSON.stringify(ordered));
  };

  const saveProducts = (updatedProducts) => {
    setProducts(updatedProducts);
    localStorage.setItem("restaurant_products", JSON.stringify(updatedProducts));
  };

  const saveCustomers = (updatedCustomers) => {
    setCustomersManual(updatedCustomers);
    localStorage.setItem("restaurant_customers", JSON.stringify(updatedCustomers));
  };

  const handleLogout = () => {
    setIsLogged(false);
  };

  const getOrdersByCustomer = (phone) => {
    return orders.filter((order) => order.customer?.phone === phone);
  };

  const deleteOrder = (id) => {
    Swal.fire({
      icon: "warning",
      title: "Eliminar pedido",
      text: "¿Seguro que quieres eliminar este pedido?",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      const updated = orders.filter((order) => order.id !== id);
      saveOrders(updated);

      if (selectedOrder?.id === id) setSelectedOrder(null);
    });
  };

  const updateOrderStatus = (id, newStatus) => {
    const updated = orders.map((order) =>
      order.id === id ? { ...order, status: newStatus } : order
    );
    saveOrders(updated);

    if (selectedOrder?.id === id) {
      const selectedUpdated = updated.find((order) => order.id === id);
      setSelectedOrder(selectedUpdated || null);
    }

    if (selectedCustomerOrders) {
      const phone = selectedCustomerOrders[0]?.customer?.phone;
      if (phone) {
        setSelectedCustomerOrders(updated.filter((o) => o.customer?.phone === phone));
      }
    }
  };

  const openWhatsApp = (order) => {
    const phone = (order.customer?.phone || "").replace(/\D/g, "");

    if (!phone) {
      Swal.fire({
        icon: "info",
        title: "Sin celular",
        text: "Este pedido no tiene celular registrado.",
        confirmButtonText: "Ok",
      });
      return;
    }

    const message =
      `Hola ${order.customer?.name || "cliente"}, ` +
      `te escribimos desde Como En Casa por tu pedido #${order.id}. ` +
      `Estado actual: ${formatStatus(order.status || "pendiente")}.`;

    const url = `https://wa.me/57${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const openInvoiceEditor = (order) => {
    setInvoiceDraft({
      orderId: order.id,
      businessName: "Como En Casa",
      date: order.date || new Date().toLocaleString("es-CO"),
      customerName: order.customer?.name || "",
      customerPhone: order.customer?.phone || "",
      orderType:
        order.customer?.orderType === "recogen"
          ? "Recogen"
          : order.customer?.orderType === "comen-alla"
          ? "Comen allá"
          : "Domicilio",
      address: order.customer?.address || "",
      notes: order.customer?.notes || "",
      observations: "",
      discount: 0,
      deliveryFee: 0,
      items: (order.items || []).map((item) => ({
        ...item,
      })),
    });
  };

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;

    setInvoiceDraft((prev) => ({
      ...prev,
      [name]:
        name === "discount" || name === "deliveryFee"
          ? Number(value || 0)
          : value,
    }));
  };

  const handleInvoiceItemChange = (index, field, value) => {
    setInvoiceDraft((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]:
          field === "quantity" || field === "price"
            ? Number(value || 0)
            : value,
      };

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const printInvoiceDraft = () => {
    if (!invoiceDraft) return;

    const subtotal = invoiceDraft.items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    const finalTotal =
      subtotal - Number(invoiceDraft.discount || 0) + Number(invoiceDraft.deliveryFee || 0);

    const win = window.open("", "_blank");

    if (!win) {
      Swal.fire({
        icon: "error",
        title: "Ventana bloqueada",
        text: "El navegador bloqueó la ventana de factura. Permite ventanas emergentes e inténtalo de nuevo.",
        confirmButtonText: "Ok",
      });
      return;
    }

    const html = `
      <html>
      <head>
        <title>Factura Editable</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #222;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #5c3b1e;
          }
          .header p {
            margin-top: 8px;
            color: #666;
          }
          .box {
            margin-bottom: 10px;
            font-size: 15px;
          }
          .section-title {
            margin: 22px 0 12px;
            color: #5c3b1e;
            font-size: 18px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #f8f5f0;
          }
          .totals {
            margin-top: 20px;
            width: 100%;
            max-width: 360px;
            margin-left: auto;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .final {
            font-size: 22px;
            font-weight: bold;
            color: #5c3b1e;
            border-top: 2px solid #ddd;
            margin-top: 10px;
            padding-top: 12px;
          }
          .notes {
            margin-top: 18px;
            padding: 12px;
            background: #f8f5f0;
            border-radius: 8px;
          }
          .print-btn {
            margin-top: 28px;
            padding: 12px 16px;
            border: none;
            background: #5c3b1e;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          }
          @media print {
            .print-btn {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${invoiceDraft.businessName}</h1>
          <p>Factura del pedido #${invoiceDraft.orderId}</p>
        </div>

        <div class="box"><strong>Fecha:</strong> ${invoiceDraft.date}</div>
        <div class="box"><strong>Cliente:</strong> ${invoiceDraft.customerName}</div>
        <div class="box"><strong>Teléfono:</strong> ${invoiceDraft.customerPhone}</div>
        <div class="box"><strong>Tipo de pedido:</strong> ${invoiceDraft.orderType}</div>
        ${
          invoiceDraft.address
            ? `<div class="box"><strong>Dirección:</strong> ${invoiceDraft.address}</div>`
            : ""
        }

        <div class="section-title">Productos</div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Valor unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceDraft.items
              .map(
                (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${Number(item.price).toLocaleString("es-CO")}</td>
                    <td>$${(Number(item.price) * Number(item.quantity)).toLocaleString("es-CO")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <strong>$${subtotal.toLocaleString("es-CO")}</strong>
          </div>
          <div class="totals-row">
            <span>Descuento</span>
            <strong>$${Number(invoiceDraft.discount || 0).toLocaleString("es-CO")}</strong>
          </div>
          <div class="totals-row">
            <span>Domicilio extra</span>
            <strong>$${Number(invoiceDraft.deliveryFee || 0).toLocaleString("es-CO")}</strong>
          </div>
          <div class="totals-row final">
            <span>Total final</span>
            <strong>$${finalTotal.toLocaleString("es-CO")}</strong>
          </div>
        </div>

        ${
          invoiceDraft.notes
            ? `<div class="notes"><strong>Notas:</strong> ${invoiceDraft.notes}</div>`
            : ""
        }

        ${
          invoiceDraft.observations
            ? `<div class="notes"><strong>Observaciones:</strong> ${invoiceDraft.observations}</div>`
            : ""
        }

        <button class="print-btn" onclick="window.print()">Imprimir factura</button>
      </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const handleProductChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setProductForm((prev) => ({
        ...prev,
        image: reader.result,
      }));
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
      const updated = products.map((product) =>
        product.id === editingProductId
          ? {
              ...product,
              name: productForm.name,
              price: Number(productForm.price),
              category: productForm.category,
              image: productForm.image,
              description: productForm.description,
            }
          : product
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

    const updated = [...products, newProduct];
    saveProducts(updated);
    resetProductForm();
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      description: product.description,
    });
    setActiveTab("productos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = (id) => {
    Swal.fire({
      icon: "warning",
      title: "Eliminar producto",
      text: "¿Eliminar este producto?",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      const updated = products.filter((product) => product.id !== id);
      saveProducts(updated);

      if (editingProductId === id) resetProductForm();
    });
  };

  const handleCustomerChange = (e) => {
    setCustomerForm({
      ...customerForm,
      [e.target.name]: e.target.value,
    });
  };

  const addCustomer = (e) => {
    e.preventDefault();

    const newCustomer = {
      id: Date.now(),
      name: customerForm.name,
      phone: customerForm.phone,
      address: customerForm.address,
      notes: customerForm.notes,
    };

    const updated = [newCustomer, ...customersManual];
    saveCustomers(updated);

    setCustomerForm({
      name: "",
      phone: "",
      address: "",
      notes: "",
    });
  };

  const deleteManualCustomer = (id) => {
    Swal.fire({
      icon: "warning",
      title: "Eliminar cliente",
      text: "¿Eliminar este cliente?",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;

      const updated = customersManual.filter((customer) => customer.id !== id);
      saveCustomers(updated);
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const text = `
        ${order.customer?.name || ""}
        ${order.customer?.phone || ""}
        ${order.customer?.orderType || ""}
        ${order.customer?.address || ""}
        ${order.customer?.notes || ""}
        ${order.status || ""}
        ${order.items.map((item) => item.name).join(" ")}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [orders, search]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const text = `
        ${product.name}
        ${product.category}
        ${product.description}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [products, search]);

  const customersAuto = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      const phone = order.customer?.phone || `sin-telefono-${order.id}`;

      if (!map[phone]) {
        map[phone] = {
          name: order.customer?.name || "Sin nombre",
          phone: order.customer?.phone || "Sin teléfono",
          orderType: order.customer?.orderType || "N/A",
          address: order.customer?.address || "",
          totalOrders: 0,
          totalSpent: 0,
        };
      }

      map[phone].totalOrders += 1;
      map[phone].totalSpent += order.total;
    });

    return Object.values(map).filter((customer) => {
      const text = `
        ${customer.name}
        ${customer.phone}
        ${customer.address}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [orders, search]);

  const filteredManualCustomers = useMemo(() => {
    return customersManual.filter((customer) => {
      const text = `
        ${customer.name}
        ${customer.phone}
        ${customer.address}
        ${customer.notes}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [customersManual, search]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    const statusCount = {
      pendiente: 0,
      en_proceso: 0,
      entregado: 0,
    };

    const productCounter = {};

    orders.forEach((order) => {
      const status = order.status || "pendiente";
      if (statusCount[status] !== undefined) {
        statusCount[status] += 1;
      }

      order.items.forEach((item) => {
        if (productCounter[item.name]) {
          productCounter[item.name] += item.quantity;
        } else {
          productCounter[item.name] = item.quantity;
        }
      });
    });

    let topProduct = "Sin datos";
    let max = 0;

    for (const product in productCounter) {
      if (productCounter[product] > max) {
        max = productCounter[product];
        topProduct = product;
      }
    }

    return {
      totalSales,
      totalOrders,
      topProduct,
      pending: statusCount.pendiente,
      processing: statusCount.en_proceso,
      delivered: statusCount.entregado,
      totalCustomers: customersAuto.length + customersManual.length,
      totalProducts: products.length,
      averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
      deliveredPercent:
        totalOrders > 0
          ? Math.round((statusCount.entregado / totalOrders) * 100)
          : 0,
    };
  }, [orders, customersAuto.length, customersManual.length, products.length]);

  const dashboard = useMemo(() => {
    const productQty = new Map();
    const productRevenue = new Map();
    const customers = new Map(); // phone -> data
    const ticketsByDay = new Map(); // day -> { total, count }
    const channelCount = { domicilio: 0, recogen: 0, "comen-alla": 0 };
    const statusCount = { pendiente: 0, en_proceso: 0, entregado: 0 };
    const ticketByChannel = { domicilio: { total: 0, count: 0 }, recogen: { total: 0, count: 0 }, "comen-alla": { total: 0, count: 0 } };
    const hourCount = new Array(24).fill(0);

    orders.forEach((order) => {
      const cust = order.customer || {};
      const phone = String(cust.phone || "").replace(/\D/g, "");
      const orderType = cust.orderType || "domicilio";
      const status = order.status || "pendiente";
      const total = Number(order.total || 0);

      if (channelCount[orderType] !== undefined) channelCount[orderType] += 1;
      if (statusCount[status] !== undefined) statusCount[status] += 1;

      if (ticketByChannel[orderType]) {
        ticketByChannel[orderType].total += total;
        ticketByChannel[orderType].count += 1;
      }

      const d = getOrderDate(order);
      const dk = dayKey(d);
      const prevDay = ticketsByDay.get(dk) || { total: 0, count: 0 };
      ticketsByDay.set(dk, { total: prevDay.total + total, count: prevDay.count + 1 });

      const hr = d.getHours();
      if (Number.isInteger(hr) && hr >= 0 && hr <= 23) hourCount[hr] += 1;

      if (phone) {
        if (!customers.has(phone)) {
          customers.set(phone, {
            phone,
            name: cust.name || "",
            lastName: cust.lastName || "",
            ordersCount: 0,
            itemsCount: 0,
            totalSpent: 0,
          });
        }
        const c = customers.get(phone);
        c.ordersCount += 1;
        c.totalSpent += total;
      }

      (order.items || []).forEach((item) => {
        const name = item.name || "Sin nombre";
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        productQty.set(name, (productQty.get(name) || 0) + qty);
        productRevenue.set(name, (productRevenue.get(name) || 0) + qty * price);

        if (phone) {
          const c = customers.get(phone);
          if (c) c.itemsCount += qty;
        }
      });
    });

    const topProducts = [...productQty.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCustomersByOrders = [...customers.values()]
      .sort((a, b) => b.ordersCount - a.ordersCount)
      .slice(0, 5);

    const topCustomersBySpent = [...customers.values()]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const days = [...ticketsByDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({
        day: k,
        total: v.total,
        avg: v.count > 0 ? v.total / v.count : 0,
        count: v.count,
      }));

    const channels = [
      { key: "domicilio", label: "Domicilio" },
      { key: "recogen", label: "Para llevar" },
      { key: "comen-alla", label: "Comer acá" },
    ];

    const channelSeries = channels.map((c) => ({
      name: c.label,
      y: channelCount[c.key] || 0,
    }));

    const ticketChannelAvg = channels.map((c) => {
      const t = ticketByChannel[c.key] || { total: 0, count: 0 };
      return {
        name: c.label,
        y: t.count > 0 ? Math.round(t.total / t.count) : 0,
      };
    });

    const hours = hourCount.map((count, h) => ({ h, count }));

    return {
      topProducts,
      topCustomersByOrders,
      topCustomersBySpent,
      days,
      channelSeries,
      statusCount,
      ticketChannelAvg,
      hours,
    };
  }, [orders]);

  if (!isLogged) {
    return <AdminLogin onLogin={setIsLogged} />;
  }

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Panel Admin 📊</h1>
          <p>Historial completo de pedidos y gestión en tiempo real</p>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "pedidos" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("pedidos")}
        >
          Pedidos
        </button>

        <button
          className={activeTab === "productos" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("productos")}
        >
          Productos
        </button>

        <button
          className={activeTab === "clientes" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("clientes")}
        >
          Clientes
        </button>

        <button
          className={activeTab === "metricas" ? "tab-btn active" : "tab-btn"}
          onClick={() => setActiveTab("metricas")}
        >
          Métricas
        </button>
      </div>

      <div className="admin-search-box">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {activeTab === "pedidos" && (
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <p>No hay pedidos todavía</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                className={`order-card status-${order.status || "pendiente"}`}
                key={order.id}
              >
                <div className="order-top">
                  <div>
                    <h3>Pedido #{order.id}</h3>
                    <p>{order.date}</p>
                  </div>

                  <span className={`status-badge status-${order.status || "pendiente"}`}>
                    {formatStatus(order.status || "pendiente")}
                  </span>
                </div>

                <div className="customer-info">
                  <p><strong>Cliente:</strong> {order.customer?.name || "Sin nombre"}</p>
                  <p><strong>Teléfono:</strong> {order.customer?.phone || "Sin teléfono"}</p>
                  <p>
                    <strong>Tipo:</strong>{" "}
                    {order.customer?.orderType === "domicilio"
                      ? "Domicilio"
                      : order.customer?.orderType === "recogen"
                      ? "Recogen"
                      : "Comen allá"}
                  </p>

                  {order.customer?.orderType === "domicilio" && (
                    <p><strong>Dirección:</strong> {order.customer?.address || "Sin dirección"}</p>
                  )}

                  {order.customer?.notes && (
                    <p><strong>Notas:</strong> {order.customer.notes}</p>
                  )}
                </div>

                <div className="order-items">
                  {order.items.map((item, i) => (
                    <div className="order-item" key={i}>
                      <span>{item.name} x{item.quantity}</span>
                      <strong>
                        ${(item.price * item.quantity).toLocaleString("es-CO")}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  Total: ${order.total.toLocaleString("es-CO")}
                </div>

                <div className="admin-order-buttons">
                  <button
                    className="btn-view"
                    onClick={() => setSelectedOrder(order)}
                  >
                    Ver detalle
                  </button>

                  <button
                    className="btn-view"
                    onClick={() => openInvoiceEditor(order)}
                  >
                    Factura
                  </button>

                  <button
                    className="btn-whatsapp"
                    onClick={() => openWhatsApp(order)}
                  >
                    WhatsApp
                  </button>

                  <button
                    className="btn-process"
                    onClick={() => updateOrderStatus(order.id, "en_proceso")}
                  >
                    En proceso
                  </button>

                  <button
                    className="btn-done"
                    onClick={() => updateOrderStatus(order.id, "entregado")}
                  >
                    Entregado
                  </button>

                  <button
                    className="btn-delete"
                    onClick={() => deleteOrder(order.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "productos" && (
        <div className="products-admin-section">
          <form className="admin-form" onSubmit={addOrUpdateProduct}>
            <h2>{editingProductId ? "Editar producto" : "Agregar producto"}</h2>

            <input
              type="text"
              name="name"
              placeholder="Nombre del producto"
              value={productForm.name}
              onChange={handleProductChange}
              required
            />

            <input
              type="number"
              name="price"
              placeholder="Precio"
              value={productForm.price}
              onChange={handleProductChange}
              required
            />

            <input
              type="text"
              name="category"
              placeholder="Categoría"
              value={productForm.category}
              onChange={handleProductChange}
              required
            />

            <input
              type="text"
              name="image"
              placeholder="Pega aquí la URL de la imagen o usa el botón de subir"
              value={productForm.image}
              onChange={handleProductChange}
              required
            />

            <label className="upload-label">
              Subir imagen desde el computador
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>

            {productForm.image && (
              <div className="image-preview-box">
                <p>Vista previa</p>
                <img
                  src={productForm.image}
                  alt="Vista previa del producto"
                  className="image-preview"
                />
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
                {editingProductId ? "Actualizar producto" : "Guardar producto"}
              </button>

              {editingProductId && (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={resetProductForm}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          <div className="admin-list">
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>No hay productos para mostrar</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div className="product-admin-card admin-item" key={product.id}>
                  <div className="product-admin-left">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-admin-image"
                    />
                  </div>

                  <div className="product-admin-center">
                    <h4>{product.name}</h4>
                    <p><strong>Categoría:</strong> {product.category}</p>
                    <p><strong>Precio:</strong> ${product.price.toLocaleString("es-CO")}</p>
                    <p>{product.description}</p>
                  </div>

                  <div className="admin-item-actions">
                    <button
                      className="btn-view"
                      onClick={() => editProduct(product)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => deleteProduct(product.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "clientes" && (
        <div className="customers-section">
          <form className="admin-form" onSubmit={addCustomer}>
            <h2>Agregar cliente</h2>

            <input
              type="text"
              name="name"
              placeholder="Nombre"
              value={customerForm.name}
              onChange={handleCustomerChange}
              required
            />

            <input
              type="text"
              name="phone"
              placeholder="Teléfono"
              value={customerForm.phone}
              onChange={handleCustomerChange}
              required
            />

            <input
              type="text"
              name="address"
              placeholder="Dirección"
              value={customerForm.address}
              onChange={handleCustomerChange}
            />

            <textarea
              name="notes"
              placeholder="Notas"
              value={customerForm.notes}
              onChange={handleCustomerChange}
            />

            <button type="submit">Guardar cliente</button>
          </form>

          {filteredManualCustomers.length > 0 &&
            filteredManualCustomers.map((customer) => (
              <div className="customer-card" key={customer.id}>
                <h3>{customer.name}</h3>
                <p><strong>Teléfono:</strong> {customer.phone}</p>
                {customer.address && (
                  <p><strong>Dirección:</strong> {customer.address}</p>
                )}
                {customer.notes && (
                  <p><strong>Notas:</strong> {customer.notes}</p>
                )}

                <div className="admin-item-actions" style={{ marginTop: "10px" }}>
                  <button
                    className="btn-view"
                    onClick={() => {
                      setSelectedCustomerName(customer.name);
                      setSelectedCustomerOrders(getOrdersByCustomer(customer.phone));
                    }}
                  >
                    Ver pedidos
                  </button>

                  <button
                    className="btn-delete"
                    onClick={() => deleteManualCustomer(customer.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

          {customersAuto.length > 0 &&
            customersAuto.map((customer, index) => (
              <div className="customer-card" key={`auto-${index}`}>
                <h3>{customer.name}</h3>
                <p><strong>Teléfono:</strong> {customer.phone}</p>
                <p><strong>Tipo más usado:</strong> {customer.orderType}</p>
                {customer.address && (
                  <p><strong>Dirección:</strong> {customer.address}</p>
                )}
                <p><strong>Pedidos:</strong> {customer.totalOrders}</p>
                <p>
                  <strong>Total gastado:</strong> $
                  {customer.totalSpent.toLocaleString("es-CO")}
                </p>

                <div className="admin-item-actions" style={{ marginTop: "10px" }}>
                  <button
                    className="btn-view"
                    onClick={() => {
                      setSelectedCustomerName(customer.name);
                      setSelectedCustomerOrders(getOrdersByCustomer(customer.phone));
                    }}
                  >
                    Ver pedidos
                  </button>
                </div>
              </div>
            ))}

          {filteredManualCustomers.length === 0 && customersAuto.length === 0 && (
            <div className="empty-state">
              <p>No hay clientes todavía</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "metricas" && (
        <div className="dashboard-metrics">
          <div className="hero-metric-card sales">
            <div className="metric-icon">💰</div>
            <div>
              <span>Ventas estimadas</span>
              <strong>${stats.totalSales.toLocaleString("es-CO")}</strong>
              <p>Resumen total acumulado de pedidos registrados</p>
            </div>
          </div>

          <div className="metrics-grid-pro">
            <div className="metric-pro-card">
              <div className="metric-top">
                <span>Total pedidos</span>
                <div className="metric-badge">📦</div>
              </div>
              <strong>{stats.totalOrders}</strong>
              <div className="metric-bar">
                <div className="metric-fill orders-fill" style={{ width: "100%" }}></div>
              </div>
            </div>

            <div className="metric-pro-card">
              <div className="metric-top">
                <span>Productos</span>
                <div className="metric-badge">🍽️</div>
              </div>
              <strong>{stats.totalProducts}</strong>
              <div className="metric-bar">
                <div
                  className="metric-fill products-fill"
                  style={{ width: `${Math.min(stats.totalProducts * 10, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="metric-pro-card">
              <div className="metric-top">
                <span>Clientes</span>
                <div className="metric-badge">👥</div>
              </div>
              <strong>{stats.totalCustomers}</strong>
              <div className="metric-bar">
                <div
                  className="metric-fill customers-fill"
                  style={{ width: `${Math.min(stats.totalCustomers * 10, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="metric-pro-card">
              <div className="metric-top">
                <span>Más pedido</span>
                <div className="metric-badge">🔥</div>
              </div>
              <strong>{stats.topProduct}</strong>
              <p className="metric-subtext">Producto líder del historial</p>
            </div>
          </div>

          <div className="metrics-grid-pro">
            <div className="metric-pro-card">
              <div className="metric-top">
                <span>Ticket promedio</span>
                <div className="metric-badge">🧾</div>
              </div>
              <strong>${Math.round(stats.averageTicket).toLocaleString("es-CO")}</strong>
              <p className="metric-subtext">Promedio por pedido registrado</p>
            </div>

            <div className="metric-pro-card">
              <div className="metric-top">
                <span>% entregados</span>
                <div className="metric-badge">✅</div>
              </div>
              <strong>{stats.deliveredPercent}%</strong>
              <div className="metric-bar">
                <div
                  className="metric-fill customers-fill"
                  style={{ width: `${stats.deliveredPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="status-metrics-grid">
            <div className="status-metric pending-card">
              <span>Pendientes</span>
              <strong>{stats.pending}</strong>
              <p>Pedidos recién ingresados</p>
            </div>

            <div className="status-metric processing-card">
              <span>En proceso</span>
              <strong>{stats.processing}</strong>
              <p>Pedidos siendo preparados</p>
            </div>

            <div className="status-metric delivered-card">
              <span>Entregados</span>
              <strong>{stats.delivered}</strong>
              <p>Pedidos ya finalizados</p>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-card-top">
                <h3>Top 5 más vendidos</h3>
                <p>Por cantidad total en el historial</p>
              </div>

              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: "bar", backgroundColor: "transparent", height: 320 },
                  title: { text: null },
                  credits: { enabled: false },
                  xAxis: {
                    categories: dashboard.topProducts.map(([name]) => name),
                    title: { text: null },
                  },
                  yAxis: { title: { text: "Unidades" } },
                  legend: { enabled: false },
                  tooltip: { pointFormat: "<b>{point.y}</b> unidades" },
                  series: [
                    {
                      name: "Unidades",
                      data: dashboard.topProducts.map(([, qty]) => qty),
                      color: "#6f4a32",
                    },
                  ],
                }}
              />
            </div>

            <div className="chart-card">
              <div className="chart-card-top">
                <h3>Clientes que más solicitan</h3>
                <p>Top 5 por número de pedidos (celular único)</p>
              </div>

              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: "column", backgroundColor: "transparent", height: 320 },
                  title: { text: null },
                  credits: { enabled: false },
                  xAxis: {
                    categories: dashboard.topCustomersByOrders.map((c) =>
                      `${(c.name || "").trim()} ${(c.lastName || "").trim()}`.trim() || c.phone
                    ),
                    labels: { rotation: -25 },
                  },
                  yAxis: { title: { text: "Pedidos" } },
                  legend: { enabled: false },
                  tooltip: { pointFormat: "<b>{point.y}</b> pedidos" },
                  series: [
                    {
                      name: "Pedidos",
                      data: dashboard.topCustomersByOrders.map((c) => c.ordersCount),
                      color: "#8a5a3b",
                    },
                  ],
                }}
              />
            </div>

            <div className="chart-card chart-card-wide">
              <div className="chart-card-top">
                <h3>Histórico de ticket diario</h3>
                <p>Total y promedio por día</p>
              </div>

              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: "areaspline", backgroundColor: "transparent", height: 340 },
                  title: { text: null },
                  credits: { enabled: false },
                  xAxis: {
                    categories: dashboard.days.map((d) => d.day),
                    tickInterval: Math.max(1, Math.floor(dashboard.days.length / 8)),
                  },
                  yAxis: { title: { text: "COP" } },
                  tooltip: { shared: true },
                  series: [
                    {
                      name: "Total",
                      data: dashboard.days.map((d) => Math.round(d.total)),
                      color: "#6f4a32",
                      fillOpacity: 0.12,
                    },
                    {
                      name: "Promedio",
                      data: dashboard.days.map((d) => Math.round(d.avg)),
                      color: "#a9764f",
                      fillOpacity: 0.05,
                    },
                  ],
                }}
              />
            </div>

            <div className="chart-card">
              <div className="chart-card-top">
                <h3>Canales</h3>
                <p>Domicilio, para llevar y comer acá</p>
              </div>

              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: "pie", backgroundColor: "transparent", height: 320 },
                  title: { text: null },
                  credits: { enabled: false },
                  tooltip: { pointFormat: "<b>{point.y}</b> pedidos" },
                  plotOptions: {
                    pie: {
                      innerSize: "60%",
                      dataLabels: { enabled: true, format: "{point.name}: {point.y}" },
                    },
                  },
                  series: [{ name: "Pedidos", data: dashboard.channelSeries }],
                }}
              />
            </div>

            <div className="chart-card">
              <div className="chart-card-top">
                <h3>Ticket promedio por canal</h3>
                <p>Comparación rápida</p>
              </div>

              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: "bar", backgroundColor: "transparent", height: 320 },
                  title: { text: null },
                  credits: { enabled: false },
                  xAxis: { categories: dashboard.ticketChannelAvg.map((p) => p.name) },
                  yAxis: { title: { text: "COP" } },
                  legend: { enabled: false },
                  tooltip: { pointFormat: "$ <b>{point.y}</b>" },
                  series: [
                    {
                      name: "Promedio",
                      data: dashboard.ticketChannelAvg.map((p) => p.y),
                      color: "#5a3926",
                    },
                  ],
                }}
              />
            </div>

            <div className="chart-card">
              <div className="chart-card-top">
                <h3>Horas pico</h3>
                <p>Pedidos por hora (según historial)</p>
              </div>

              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: "column", backgroundColor: "transparent", height: 320 },
                  title: { text: null },
                  credits: { enabled: false },
                  xAxis: { categories: dashboard.hours.map((h) => `${String(h.h).padStart(2, "0")}:00`) },
                  yAxis: { title: { text: "Pedidos" } },
                  legend: { enabled: false },
                  series: [
                    {
                      name: "Pedidos",
                      data: dashboard.hours.map((h) => h.count),
                      color: "#9c6a43",
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h2>Detalle del pedido #{selectedOrder.id}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div className="customer-info">
              <p><strong>Fecha:</strong> {selectedOrder.date}</p>
              <p><strong>Cliente:</strong> {selectedOrder.customer?.name || "Sin nombre"}</p>
              <p><strong>Teléfono:</strong> {selectedOrder.customer?.phone || "Sin teléfono"}</p>
              <p>
                <strong>Tipo:</strong>{" "}
                {selectedOrder.customer?.orderType === "domicilio"
                  ? "Domicilio"
                  : selectedOrder.customer?.orderType === "recogen"
                  ? "Recogen"
                  : "Comen allá"}
              </p>

              {selectedOrder.customer?.orderType === "domicilio" && (
                <p><strong>Dirección:</strong> {selectedOrder.customer?.address || "Sin dirección"}</p>
              )}

              {selectedOrder.customer?.notes && (
                <p><strong>Notas:</strong> {selectedOrder.customer.notes}</p>
              )}

              <p><strong>Estado:</strong> {formatStatus(selectedOrder.status || "pendiente")}</p>
            </div>

            <div className="order-items">
              {selectedOrder.items.map((item, i) => (
                <div className="order-item" key={i}>
                  <span>{item.name} x{item.quantity}</span>
                  <strong>${(item.price * item.quantity).toLocaleString("es-CO")}</strong>
                </div>
              ))}
            </div>

            <div className="order-total">
              Total: ${selectedOrder.total.toLocaleString("es-CO")}
            </div>
          </div>
        </div>
      )}

      {selectedCustomerOrders && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedCustomerOrders(null);
            setSelectedCustomerName("");
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h2>Pedidos de {selectedCustomerName}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setSelectedCustomerOrders(null);
                  setSelectedCustomerName("");
                }}
              >
                ✕
              </button>
            </div>

            {selectedCustomerOrders.length === 0 ? (
              <div className="empty-state">
                <p>Este cliente no tiene pedidos registrados</p>
              </div>
            ) : (
              <div className="orders-list">
                {selectedCustomerOrders.map((order) => (
                  <div className="order-card" key={order.id}>
                    <div className="order-top">
                      <div>
                        <h3>Pedido #{order.id}</h3>
                        <p>{order.date}</p>
                      </div>

                      <span className={`status-badge status-${order.status || "pendiente"}`}>
                        {formatStatus(order.status || "pendiente")}
                      </span>
                    </div>

                    <div className="order-items">
                      {order.items.map((item, i) => (
                        <div className="order-item" key={i}>
                          <span>{item.name} x{item.quantity}</span>
                          <strong>
                            ${(item.price * item.quantity).toLocaleString("es-CO")}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="order-total">
                      Total: ${order.total.toLocaleString("es-CO")}
                    </div>

                    <div className="admin-item-actions" style={{ marginTop: "12px" }}>
                      <button className="btn-view" onClick={() => openInvoiceEditor(order)}>
                        Factura
                      </button>

                      <button className="btn-whatsapp" onClick={() => openWhatsApp(order)}>
                        WhatsApp
                      </button>

                      <button className="btn-view" onClick={() => setSelectedOrder(order)}>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {invoiceDraft && (
        <div className="modal-overlay" onClick={() => setInvoiceDraft(null)}>
          <div className="modal-card invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h2>Factura editable</h2>
              <button className="modal-close" onClick={() => setInvoiceDraft(null)}>
                ✕
              </button>
            </div>

            <div className="invoice-grid">
              <input
                type="text"
                name="businessName"
                placeholder="Nombre del negocio"
                value={invoiceDraft.businessName}
                onChange={handleInvoiceChange}
              />

              <input
                type="text"
                name="date"
                placeholder="Fecha"
                value={invoiceDraft.date}
                onChange={handleInvoiceChange}
              />

              <input
                type="text"
                name="customerName"
                placeholder="Cliente"
                value={invoiceDraft.customerName}
                onChange={handleInvoiceChange}
              />

              <input
                type="text"
                name="customerPhone"
                placeholder="Teléfono"
                value={invoiceDraft.customerPhone}
                onChange={handleInvoiceChange}
              />

              <input
                type="text"
                name="orderType"
                placeholder="Tipo de pedido"
                value={invoiceDraft.orderType}
                onChange={handleInvoiceChange}
              />

              <input
                type="text"
                name="address"
                placeholder="Dirección"
                value={invoiceDraft.address}
                onChange={handleInvoiceChange}
              />

              <input
                type="number"
                name="discount"
                placeholder="Descuento"
                value={invoiceDraft.discount}
                onChange={handleInvoiceChange}
              />

              <input
                type="number"
                name="deliveryFee"
                placeholder="Domicilio extra"
                value={invoiceDraft.deliveryFee}
                onChange={handleInvoiceChange}
              />

              <textarea
                name="notes"
                placeholder="Notas"
                value={invoiceDraft.notes}
                onChange={handleInvoiceChange}
              />

              <textarea
                name="observations"
                placeholder="Observaciones de factura"
                value={invoiceDraft.observations}
                onChange={handleInvoiceChange}
              />
            </div>

            <div className="invoice-edit-list">
              <h3>Productos de la factura</h3>

              {invoiceDraft.items.map((item, index) => (
                <div className="invoice-edit-item" key={`${item.id}-${index}`}>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleInvoiceItemChange(index, "name", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleInvoiceItemChange(index, "quantity", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      handleInvoiceItemChange(index, "price", e.target.value)
                    }
                  />

                  <strong>
                    ${(
                      Number(item.quantity) * Number(item.price)
                    ).toLocaleString("es-CO")}
                  </strong>
                </div>
              ))}
            </div>

            <div className="admin-item-actions" style={{ marginTop: "18px" }}>
              <button className="btn-view" onClick={printInvoiceDraft}>
                Imprimir factura
              </button>

              <button className="btn-delete" onClick={() => setInvoiceDraft(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Admin;