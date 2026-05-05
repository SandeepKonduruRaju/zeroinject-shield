import { useState, useEffect } from 'react'

const NAV_LINKS = ['Home', 'Products', 'Contact']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass shadow-lg shadow-nova/5' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nova to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-nova/30 group-hover:shadow-nova/50 transition-shadow">
            N
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Nova</span>
            <span className="text-nova-light">Cart</span>
          </span>
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm text-slate-400 hover:text-white transition-colors relative group"
            >
              {link}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-nova rounded-full group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA */}
        <button className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl bg-nova/10 border border-nova/30 text-nova-light text-sm font-medium hover:bg-nova/20 hover:border-nova/50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8l-1.35 2.7A1 1 0 006.96 19h10.08M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          Cart (0)
        </button>
      </div>
    </nav>
  )
}
