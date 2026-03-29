function CategoryFilter({ categories, selectedCategory, setSelectedCategory }) {
    return (
      <div className="category-filter">
        <button
          className={selectedCategory === "Todos" ? "active" : ""}
          onClick={() => setSelectedCategory("Todos")}
        >
          Todos
        </button>
  
        {categories.map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? "active" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    );
  }
  
  export default CategoryFilter;