import { useState, useRef, useEffect } from 'react'
import { businessData } from '../data/businessData'
import { products } from '../data/products'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const QUICK_ACTIONS = [
  'Shipping Info',
  'Discounts',
  'Track Order'
]

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your NovaCart assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const [securityOn, setSecurityOn] = useState(true)

  const generateBotResponse = (userMessage) => {
    const text = userMessage.toLowerCase()
    
    // Pattern matching
    if (text.includes('shipping') || text.includes('delivery') || text.includes('time')) {
      return getRandomResponse(businessData.shipping)
    }
    if (text.includes('return') || text.includes('refund')) {
      return getRandomResponse(businessData.returns)
    }
    if (text.includes('discount') || text.includes('offer') || text.includes('coupon')) {
      return getRandomResponse(businessData.discounts)
    }
    if (text.includes('help') || text.includes('support')) {
      return getRandomResponse(businessData.support)
    }
    if (text.includes('order') || text.includes('track')) {
      return "You can track your order using the link sent to your email, or provide your order ID here and I'll check its status."
    }
    
    // Product matching
    if (text.includes('product') || text.includes('price')) {
      return `We have several great products! Our ${products[0].name} might be perfect for you.`
    }
    
    // Check specific products
    for (const product of products) {
      const words = product.name.toLowerCase().split(' ')
      if (words.some(word => word.length > 3 && text.includes(word))) {
        let resp = `The ${product.name} is a great choice! ${product.description} It costs ${product.price}.`
        if (Math.random() > 0.5) resp += ' Would you like to add it to your cart?'
        return resp
      }
    }

    // Fallback
    const fallbacks = [
      "I can help with products, shipping, orders, or discounts. What would you like to know?",
      "I'm not quite sure about that. Could you ask about our products, shipping policies, or discounts?",
      "To assist you best, please ask me about shipping, returns, or specific products we offer."
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }

  const getRandomResponse = (array) => {
    const baseResponse = array[Math.floor(Math.random() * array.length)]
    
    if (Math.random() > 0.7) {
      const followUps = [
        " Would you like recommendations?",
        " Can I help with anything else?",
        " Do you need tracking details for a specific order?"
      ]
      return baseResponse + followUps[Math.floor(Math.random() * followUps.length)]
    }
    return baseResponse
  }

  const sanitizeFrontendInput = (input) => {
    let cleaned = input

    const patterns = [
      /ignore.*instructions?/gi,
      /reveal.*(system|prompt)/gi,
      /act as .*admin/gi,
      /bypass.*security/gi,
      /override.*rules/gi
    ]

    let modified = false

    patterns.forEach((pattern) => {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '')
        modified = true
      }
    })

    cleaned = cleaned.trim()

    return {
      cleanedInput: cleaned,
      wasModified: modified
    }
  }

  const handleSend = async (text = input) => {
    const userMsg = text.trim()
    if (!userMsg) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')
    setIsTyping(true)

    const { cleanedInput, wasModified } = sanitizeFrontendInput(userMsg)
    const finalInput = cleanedInput.length > 0 ? cleanedInput : userMsg

    if (wasModified) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        text: 'Unsafe instructions were removed from your request.' 
      }])
    }

    if (securityOn) {
      try {
        const response = await fetch(`${API}/api/secure-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: finalInput, original_input: userMsg }),
        })

        if (!response.ok) throw new Error('API Request Failed')
        const data = await response.json()

        setMessages(prev => [...prev, {
          role: 'assistant',
          text: data.response,
          verdict: data.verdict,
          action: data.action_taken,
          score: data.injection_score,
          attack_type: data.attack_type
        }])
      } catch (e) {
        console.error(e)
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: "I’m having trouble responding right now. Please try again."
        }])
      } finally {
        setIsTyping(false)
      }
    } else {
      const delay = Math.floor(Math.random() * 700) + 800
      setTimeout(() => {
        const response = generateBotResponse(finalInput)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: response,
          verdict: "UNPROTECTED",
          action: "DIRECT",
          score: null,
          attack_type: null
        }])
        setIsTyping(false)
      }, delay)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-nova to-nova-dark text-white rounded-full shadow-lg shadow-nova/30 flex items-center justify-center hover:scale-110 hover:shadow-nova/50 transition-all z-50 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 w-[360px] h-[540px] bg-card border border-border shadow-2xl shadow-nova/10 rounded-2xl flex flex-col overflow-hidden z-50 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-surface border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nova to-accent flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white text-sm font-semibold">Nova Assistant</h3>
                <button 
                  onClick={() => setSecurityOn(!securityOn)}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                    securityOn ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
                  }`}
                >
                  Security: {securityOn ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-nova-light text-[10px] uppercase tracking-wider font-semibold">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMessages([{ role: 'assistant', text: 'Chat cleared. How can I help you?' }])} className="p-1.5 text-slate-400 hover:text-white hover:bg-nova/10 rounded-lg transition-colors" title="Clear Chat">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-nova/10 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 chat-scroll space-y-4 bg-bg/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center my-2' : 'items-start'}`}>
              {msg.role === 'system' ? (
                <div className="text-[10px] text-orange-400/80 italic font-mono px-4 text-center animate-fade-in">
                  {msg.text}
                </div>
              ) : (
                <>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-nova text-white rounded-tr-sm'
                        : 'bg-surface border border-border text-slate-200 rounded-tl-sm shadow-sm'
                    } animate-fade-in`}
                  >
                    {msg.text}
                  </div>
                  
                  {/* Metadata Indicators for bot messages */}
                  {msg.verdict && (
                    <div className="flex items-center gap-2 mt-1.5 ml-1 flex-wrap animate-fade-in max-w-[85%]">
                      {msg.verdict === 'UNPROTECTED' ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-red-400 border-red-500/30 bg-red-500/10">
                          UNPROTECTED MODE
                        </span>
                      ) : (
                        <>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            msg.verdict === 'BLOCKED' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                            msg.verdict === 'FLAGGED' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
                            'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                          }`}>
                            {msg.verdict}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono border border-border bg-black/20 px-1.5 py-0.5 rounded">
                            {msg.action}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {Math.round((msg.score || 0) * 100)}%
                          </span>
                          {msg.attack_type && (
                            <span className="text-[9px] text-slate-500 font-mono">
                              | Type: {msg.attack_type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions & Input */}
        <div className="bg-surface border-t border-border p-3">
          <div className="flex gap-2 overflow-x-auto pb-2 chat-scroll">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="whitespace-nowrap px-3 py-1.5 bg-nova/10 hover:bg-nova/20 border border-nova/20 text-nova-light text-xs rounded-full transition-colors flex-shrink-0"
              >
                {action}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nova/50 placeholder:text-slate-500 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-nova hover:bg-nova-dark text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
