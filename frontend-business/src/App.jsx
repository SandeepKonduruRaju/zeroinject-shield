import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Products from './components/Products'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'

function App() {
  return (
    <div className="min-h-screen bg-bg relative">
      <Navbar />
      <main>
        <Hero />
        <Products />
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}

export default App
