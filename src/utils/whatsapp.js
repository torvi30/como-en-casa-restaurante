export function saveOrderToHistory(cart, customerData, total) {
  const existing =
    JSON.parse(localStorage.getItem("restaurant_orders")) || [];

  const grouped = [];

  cart.forEach((item) => {
    const found = grouped.find((p) => p.id === item.id);

    if (found) {
      found.quantity += 1;
    } else {
      grouped.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      });
    }
  });

  const newOrder = {
    id: Date.now(),
    date: new Date().toLocaleString("es-CO"),
    customer: customerData,
    items: grouped,
    total,
    status: "pendiente",
  };

  const updated = [newOrder, ...existing];

  localStorage.setItem("restaurant_orders", JSON.stringify(updated));
}

export function createWhatsAppLink(cart, customerData, total) {
  const phone = "573000000000"; // CAMBIA

  const text = cart
    .map((p) => `${p.name} - $${p.price}`)
    .join("\n");

  const fullName = `${customerData.name || ""} ${customerData.lastName || ""}`.trim();
  const optionalPhone = (customerData.optionalPhone || "").trim();

  const msg = `
Pedido nuevo

Cliente: ${fullName || customerData.name}
Celular: ${customerData.phone}
${optionalPhone ? `Tel fijo: ${optionalPhone}\n` : ""}
Tipo: ${
    customerData.orderType === "recogen"
      ? "Para llevar"
      : customerData.orderType === "comen-alla"
      ? "Comer acá"
      : "Domicilio"
  }
${customerData.orderType === "domicilio" ? `Dirección: ${customerData.address || ""}\n` : ""}
${customerData.notes ? `Notas: ${customerData.notes}\n` : ""}

${text}

Total: $${total}
`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}