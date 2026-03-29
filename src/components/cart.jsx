import {
    generateWhatsAppLink,
    saveOrderToHistory,
    groupCartItems,
  } from "../utils/whatsapp";
  
  function Cart({
    cart,
    removeFromCart,
    clearCart,
    customerData,
    handleCustomerChange,
  }) {
    const grouped = groupCartItems(cart);
  
    const total = grouped.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  
    const validateOrder = () => {
      if (cart.length === 0) {
        alert("El carrito está vacío 🛒");
        return false;
      }
  
      if (!customerData.name.trim()) {
        alert("Falta el nombre del cliente");
        return false;
      }
  
      if (!customerData.phone.trim()) {
        alert("Falta el teléfono del cliente");
        return false;
      }
  
      if (
        customerData.orderType === "domicilio" &&
        !customerData.address.trim()
      ) {
        alert("Falta la dirección para el domicilio");
        return false;
      }
  
      return true;
    };
  
    return (
      <div className="cart-box">
        <h2>Mi pedido</h2>
  
        <div className="customer-form">
          <input
            type="text"
            name="name"
            placeholder="Nombre del cliente"
            value={customerData.name}
            onChange={handleCustomerChange}
          />
  
          <input
            type="text"
            name="phone"
            placeholder="Teléfono"
            value={customerData.phone}
            onChange={handleCustomerChange}
          />
  
          <select
            name="orderType"
            value={customerData.orderType}
            onChange={handleCustomerChange}
          >
            <option value="domicilio">Domicilio</option>
            <option value="recogen">Recogen</option>
            <option value="comen_alla">Comen allá</option>
          </select>
  
          {customerData.orderType === "domicilio" && (
            <input
              type="text"
              name="address"
              placeholder="Dirección"
              value={customerData.address}
              onChange={handleCustomerChange}
            />
          )}
  
          <textarea
            name="notes"
            placeholder="Notas del pedido"
            value={customerData.notes}
            onChange={handleCustomerChange}
          />
        </div>
  
        {grouped.length === 0 ? (
          <p>No has agregado productos todavía.</p>
        ) : (
          <>
            {grouped.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.quantity} x ${item.price.toLocaleString("es-CO")}
                  </p>
                </div>
  
                <button onClick={() => removeFromCart(item.id)}>Quitar</button>
              </div>
            ))}
  
            <h3>Total: ${total.toLocaleString("es-CO")}</h3>
  
            <div className="cart-actions">
              <a
                href={generateWhatsAppLink(cart, customerData)}
                target="_blank"
                rel="noreferrer"
                className="whatsapp-btn"
                onClick={(e) => {
                  if (!validateOrder()) {
                    e.preventDefault();
                    return;
                  }
  
                  saveOrderToHistory(cart, customerData);
                }}
              >
                Pedir por WhatsApp
              </a>
  
              <button onClick={clearCart} className="clear-btn">
                Vaciar pedido
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  
  export default Cart;