import { products } from '../data/products'

function ProductCard({ product, index }) {
  return (
    <div
      className="group bg-card border border-border rounded-2xl p-6 hover:border-nova/40 hover:shadow-lg hover:shadow-nova/5 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Icon + Category */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-xl bg-nova/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-nova/20 transition-all">
          {product.emoji}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium bg-surface px-2.5 py-1 rounded-lg border border-border">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <h3 className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-nova-light transition-colors">
        {product.name}
      </h3>
      <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
        {product.description}
      </p>

      {/* Price + CTA */}
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-white">{product.price}</span>
        <button className="px-4 py-2 rounded-lg bg-nova/10 border border-nova/30 text-nova-light text-xs font-medium hover:bg-nova/20 hover:border-nova/50 transition-all">
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default function Products() {
  return (
    <section id="products" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-nova-light font-medium">Our Collection</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">Featured Products</h2>
          <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto">
            Handpicked products with exceptional quality and value.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
