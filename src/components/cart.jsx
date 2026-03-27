import { createWhatsAppLink, saveOrderToHistory } from "../utils/whatsapp";
import Swal from "sweetalert2";

function Cart({
  cart,
  removeFromCart,
  clearCart,
  customerData,
  handleCustomerChange,
}) {
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const validateOrder = () => {
    if (cart.length === 0) {
      return {
        ok: false,
        title: "Tu pedido está vacío",
        text: "Agrega productos antes de enviar por WhatsApp.",
      };
    }

    const firstName = (customerData.name || "").trim();
    const lastName = (customerData.lastName || "").trim();
    const mobileRaw = (customerData.phone || "").replace(/\D/g, "");
    const optionalPhone = (customerData.optionalPhone || "").trim();
    const address = (customerData.address || "").trim();

    if (firstName.length <= 3 || lastName.length <= 3) {
      return {
        ok: false,
        title: "Nombre incompleto",
        text: "Escribe nombre y apellido (más de 3 caracteres cada uno).",
      };
    }

    if (!/^3\d{9}$/.test(mobileRaw)) {
      return {
        ok: false,
        title: "Celular inválido",
        text: "El número debe empezar por 3 y tener 10 dígitos.",
      };
    }

    if (customerData.orderType === "domicilio" && address.length === 0) {
      return {
        ok: false,
        title: "Falta la dirección",
        text: "Para domicilio debes escribir la dirección.",
      };
    }

    return {
      ok: true,
      normalizedCustomer: {
        ...customerData,
        name: firstName,
        lastName,
        phone: mobileRaw,
        optionalPhone,
        address,
      },
    };
  };

  const handleSendOrder = async () => {
    const validation = validateOrder();

    if (!validation.ok) {
      await Swal.fire({
        icon: "warning",
        title: validation.title,
        text: validation.text,
        confirmButtonText: "Listo",
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Enviar pedido por WhatsApp?",
      text: "Revisa que la información esté correcta antes de continuar.",
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!isConfirmed) return;

    saveOrderToHistory(cart, validation.normalizedCustomer, total);

    const link = createWhatsAppLink(cart, validation.normalizedCustomer, total);
    window.open(link, "_blank");

    await Swal.fire({
      icon: "success",
      title: "Pedido listo",
      text: "Se abrió WhatsApp para enviar tu pedido.",
      timer: 1400,
      showConfirmButton: false,
    });

    clearCart();
  };

  return (
    <aside className="cart-box">
      <h2>Mi pedido</h2>

      <div className="customer-form">
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={customerData.name}
          onChange={handleCustomerChange}
        />

        <input
          type="text"
          name="lastName"
          placeholder="Apellido"
          value={customerData.lastName || ""}
          onChange={handleCustomerChange}
        />

        <input
          type="tel"
          inputMode="numeric"
          name="phone"
          placeholder="Celular (10 dígitos)"
          value={customerData.phone}
          onChange={handleCustomerChange}
        />

        <input
          type="tel"
          name="optionalPhone"
          placeholder="Teléfono fijo (opcional)"
          value={customerData.optionalPhone || ""}
          onChange={handleCustomerChange}
        />

        <select
          name="orderType"
          value={customerData.orderType}
          onChange={handleCustomerChange}
        >
          <option value="domicilio">Domicilio</option>
          <option value="recogen">Recogen</option>
          <option value="comen-alla">Comen allá</option>
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
          placeholder="Notas"
          value={customerData.notes}
          onChange={handleCustomerChange}
        />
      </div>

      {cart.length === 0 ? (
        <p className="empty-cart-text">No hay productos</p>
      ) : (
        <>
          <div className="cart-items-list">
            {cart.map((item, index) => (
              <div className="cart-item" key={`${item.id}-${index}`}>
                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <p>${item.price.toLocaleString("es-CO")}</p>
                </div>

                <button
                  type="button"
                  className="cart-remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <h3 className="cart-total">
            Total: ${total.toLocaleString("es-CO")}
          </h3>

          <div className="cart-actions">
            <button
              type="button"
              className="whatsapp-btn"
              onClick={handleSendOrder}
            >
              Enviar pedido por WhatsApp
            </button>

            <button
              type="button"
              className="clear-btn"
              onClick={clearCart}
            >
              Vaciar pedido
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

export default Cart;