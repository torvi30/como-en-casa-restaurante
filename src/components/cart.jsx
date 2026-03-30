import { useState } from "react";
import AdminLogin from "../components/adminLogin";

function Admin() {
  const [isLogged, setIsLogged] = useState(false);
  const [activeTab, setActiveTab] = useState("pedidos");
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState(null);

  const orders =
    JSON.parse(localStorage.getItem("restaurant_orders")) || [];

  const getOrdersByCustomer = (phone) => {
    return orders.filter(
      (order) => order.customer?.phone === phone
    );
  };

  const customers = {};

  orders.forEach((order) => {
    const phone = order.customer?.phone || "sin-telefono";

    if (!customers[phone]) {
      customers[phone] = {
        name: order.customer?.name || "Sin nombre",
        phone,
        totalOrders: 0,
      };
    }

    customers[phone].totalOrders += 1;
  });

  const customerList = Object.values(customers);

  if (!isLogged) {
    return <AdminLogin onLogin={setIsLogged} />;
  }

  return (
    <section style={{ padding: "20px" }}>
      <h1>Panel Admin 📊</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("pedidos")}>
          Pedidos
        </button>

        <button onClick={() => setActiveTab("clientes")}>
          Clientes
        </button>
      </div>

      {/* ===================== PEDIDOS ===================== */}
      {activeTab === "pedidos" && (
        <div>
          {orders.length === 0 ? (
            <p>No hay pedidos</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: "1px solid #ddd",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                }}
              >
                <h3>Pedido #{order.id}</h3>
                <p><strong>Cliente:</strong> {order.customer?.name}</p>
                <p><strong>Tel:</strong> {order.customer?.phone}</p>
                <p><strong>Fecha:</strong> {order.date}</p>

                {order.items.map((item, i) => (
                  <div key={i}>
                    {item.name} x{item.quantity}
                  </div>
                ))}

                <strong>
                  Total: ${order.total.toLocaleString("es-CO")}
                </strong>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===================== CLIENTES ===================== */}
      {activeTab === "clientes" && (
        <div>
          {customerList.length === 0 ? (
            <p>No hay clientes</p>
          ) : (
            customerList.map((customer, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                }}
              >
                <h3>{customer.name}</h3>
                <p>Tel: {customer.phone}</p>
                <p>Pedidos: {customer.totalOrders}</p>

                <button
                  onClick={() =>
                    setSelectedCustomerOrders(
                      getOrdersByCustomer(customer.phone)
                    )
                  }
                >
                  Ver pedidos
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===================== MODAL ===================== */}
      {selectedCustomerOrders && (
        <div
          onClick={() => setSelectedCustomerOrders(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2>Pedidos del cliente</h2>

            {selectedCustomerOrders.length === 0 ? (
              <p>No hay pedidos</p>
            ) : (
              selectedCustomerOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    borderBottom: "1px solid #ddd",
                    marginBottom: "10px",
                    paddingBottom: "10px",
                  }}
                >
                  <p><strong>Fecha:</strong> {order.date}</p>

                  {order.items.map((item, i) => (
                    <div key={i}>
                      {item.name} x{item.quantity}
                    </div>
                  ))}

                  <strong>
                    Total: ${order.total.toLocaleString("es-CO")}
                  </strong>
                </div>
              ))
            )}

            <button
              onClick={() => setSelectedCustomerOrders(null)}
              style={{ marginTop: "10px" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Admin;