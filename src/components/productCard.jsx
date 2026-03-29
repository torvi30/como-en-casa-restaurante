function ProductCard({ product, addToCart }) {
    return (
      <div className="product-card">
        <img src={product.image} alt={product.name} className="product-image" />
  
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