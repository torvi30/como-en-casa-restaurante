export function groupCartItems(cart) {
    const grouped = {};
  
    cart.forEach((item) => {
      if (grouped[item.name]) {
        grouped[item.name].quantity += 1;
      } else {
        grouped[item.name] = {
          ...item,
          quantity: 1,
        };
      }
    });
  
    return Object.values(grouped);
  }
  
  export function saveOrderToHistory(cart, customerData) {
    const grouped = groupCartItems(cart);
  
    const total = grouped.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  
    const newOrder = {
      id: Date.now(),
      customer: {
        name: customerData.name,
        phone: customerData.phone,
        orderType: customerData.orderType,
        address: customerData.orderType === "domicilio" ? customerData.address : "",
        notes: customerData.notes || "",
      },
      items: grouped,
      total,
      date: new Date().toLocaleString("es-CO"),
    };
  
    const existingOrders =
      JSON.parse(localStorage.getItem("restaurant_orders")) || [];
  
    const updatedOrders = [newOrder, ...existingOrders];
  
    localStorage.setItem("restaurant_orders", JSON.stringify(updatedOrders));
  }
  
  export function generateWhatsAppLink(cart, customerData) {
    const grouped = groupCartItems(cart);
  
    const total = grouped.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  
    let message = "Hola, quiero hacer este pedido:%0A%0A";
    message += `Nombre: ${customerData.name}%0A`;
    message += `Teléfono: ${customerData.phone}%0A`;
    message += `Tipo de pedido: ${customerData.orderType}%0A`;
  
    if (customerData.orderType === "domicilio") {
      message += `Dirección: ${customerData.address}%0A`;
    }
  
    if (customerData.notes?.trim()) {
      message += `Notas: ${customerData.notes}%0A`;
    }
  
    message += `%0AProductos:%0A`;
  
    grouped.forEach((item) => {
      message += `• ${item.name} x${item.quantity} = $${item.price * item.quantity}%0A`;
    });
  
    message += `%0ATotal aproximado: $${total}`;
  
    return `https://wa.me/573000000000?text=${message}`;
  }