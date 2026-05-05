export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-nova/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nova/10 border border-nova/20 text-nova-light text-xs font-medium mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          AI-Powered Shopping Experience
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
          <span className="text-white">Smart Shopping</span>
          <br />
          <span className="gradient-text">Experience</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Shop smarter with AI assistance. Discover curated products, get instant answers, and enjoy a seamless shopping experience powered by intelligent technology.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <a
            href="#products"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-nova to-nova-dark text-white font-semibold shadow-lg shadow-nova/30 hover:shadow-nova/50 hover:scale-105 transition-all"
          >
            Browse Products
          </a>
          <a
            href="#contact"
            className="px-8 py-3.5 rounded-xl border border-border text-slate-300 font-medium hover:bg-card hover:border-nova/30 transition-all"
          >
            Get in Touch
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { value: '2K+', label: 'Products' },
            { value: '50K+', label: 'Customers' },
            { value: '4.9★', label: 'Rating' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-border flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-nova-light rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
