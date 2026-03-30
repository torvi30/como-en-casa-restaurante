function ProductCard({ product, addToCart }) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80";

  return (
    <div className="product-card">
      <img
        src={product.image}
        alt={product.name}
        className="product-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = fallbackImage;
        }}
      />

      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <span className="category">{product.category}</span>
        <h4>${product.price.toLocaleString("es-CO")}</h4>

        <button onClick={() => addToCart(product)}>
          Agregar al pedido
        </button>
      </div>
    </div>
  );
}

export default ProductCard;