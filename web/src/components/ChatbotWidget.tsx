import { useEffect, useRef, useState } from 'react'
import { chatbotAdvanced, getProduct, handoff, submitQuote } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'
import { useQuoteCart } from '../cart/QuoteCartContext'

type ChatItem = { role: 'user' | 'assistant'; text: string }

function uid() {
  return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function AssistantFabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="chatFabStroke" x1="8" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path
        d="M10 14h12M10 18h8"
        stroke="url(#chatFabStroke)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 24l2.5-4H22a3 3 0 003-3V9a3 3 0 00-3-3H10a3 3 0 00-3 3v12l1-.75z"
        stroke="url(#chatFabStroke)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="8" r="4" fill="#0f766e" opacity="0.95" />
      <path d="M22.5 8h3M24 6.5v3" stroke="#ecfdf5" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function ChatbotWidget() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const { items, add } = useQuoteCart()
  const [open, setOpen] = useState(false)
  const [conversationId] = useState(() => uid())
  const [input, setInput] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [handoffLoading, setHandoffLoading] = useState(false)
  const [handoffNotice, setHandoffNotice] = useState<string | null>(null)
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [quoteStoreId, setQuoteStoreId] = useState<number | null>(null)
  const [quoteDetails, setQuoteDetails] = useState<string>('')
  const [itemsUi, setItemsUi] = useState<ChatItem[]>([
    {
      role: 'assistant',
      text: isEn
        ? 'Hi, I am the Tienda Online assistant. I can help with products, your shopping cart, stores, and contact.'
        : 'Hola, soy el asistente de Tienda Online. Le ayudo con productos, carrito de compras, tiendas y contacto.',
    },
  ])

  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }, [open, itemsUi.length])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setHandoffNotice(null)
    setInput('')
    setItemsUi((prev) => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const nextHist = [...history, { role: 'user' as const, content: text }]
      const result = await chatbotAdvanced({
        message: text,
        history: nextHist,
        language: isEn ? 'en' : 'es',
        userId: conversationId,
        cartItems: items.map((i) => ({
          id_product: i.id_product,
          quantity: i.quantity,
          note: i.note,
        })),
      })
      setHistory((h) => [
        ...h,
        { role: 'user', content: text },
        { role: 'assistant', content: result.reply },
      ])

      const actions = result.actions?.length
        ? result.actions
        : result.action === 'add_to_cart' && result.payload
          ? [{ type: 'add_to_cart' as const, id_product: result.payload.id_product, quantity: result.payload.qty }]
          : []

      let suffix = ''
      for (const a of actions) {
        if (a.type === 'add_to_cart') {
          let nameSnapshot: string | undefined
          if (typeof a.name_product === 'string' && a.name_product.trim()) {
            nameSnapshot = a.name_product.trim()
          } else {
            try {
              const p = await getProduct(a.id_product)
              nameSnapshot = p.name_product?.trim() || undefined
            } catch {
              nameSnapshot = undefined
            }
          }
          add({
            id_product: a.id_product,
            quantity: a.quantity,
            note: a.note ?? undefined,
            name_snapshot: nameSnapshot,
          })
          suffix += isEn ? '\n(Item added to your cart.)' : '\n(Ítem agregado al carrito de compras.)'
        }
        if (a.type === 'select_store') {
          setQuoteStoreId(a.id_store)
          suffix += isEn ? `\n(Store selected: #${a.id_store})` : `\n(Tienda seleccionada: #${a.id_store})`
        }
        if (a.type === 'set_quote_details') {
          setQuoteDetails(a.det_quote)
          suffix += isEn ? '\n(Order notes updated.)' : '\n(Notas del pedido actualizadas.)'
        }
        if (a.type === 'go_to_quote_page') {
          window.location.href = '/carrito'
        }
        if (a.type === 'submit_quote') {
          const idStore = quoteStoreId
          if (!idStore) {
            suffix += isEn
              ? '\n(To send the order, please tell me which store you want.)'
              : '\n(Para enviar el pedido, indíqueme a cuál tienda desea enviarlo.)'
          } else if (items.length === 0) {
            suffix += isEn
              ? '\n(Your cart is empty. Tell me which product to add.)'
              : '\n(Su carrito está vacío. Dígame qué producto agregar.)'
          } else {
            try {
              await submitQuote({
                id_store: idStore,
                det_quote: quoteDetails,
                items: items.map((i) => ({ id_product: i.id_product, quantity: i.quantity, note: i.note })),
              })
              suffix += isEn ? '\n(Order submitted successfully.)' : '\n(Pedido enviado correctamente.)'
            } catch (e) {
              suffix += isEn
                ? `\n(Could not submit order: ${(e as Error).message})`
                : `\n(No se pudo enviar el pedido: ${(e as Error).message})`
            }
          }
        }
      }

      setItemsUi((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.reply + suffix,
        },
      ])
    } catch {
      setItemsUi((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: isEn
            ? 'I could not reply right now. Please try again in a few seconds.'
            : 'No pude responder en este momento. Intente nuevamente en unos segundos.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function requestAdvisor() {
    if (handoffLoading) return
    setHandoffNotice(null)
    setHandoffLoading(true)
    try {
      const transcript = itemsUi
        .map((m) =>
          `${m.role === 'user' ? (isEn ? 'Customer' : 'Cliente') : isEn ? 'Assistant' : 'Asistente'}: ${m.text}`,
        )
        .join('\n')
      const res = await handoff(conversationId, isEn ? 'en' : 'es', phone.trim(), transcript)
      if (!res.ok) {
        setHandoffNotice(res.error || (isEn ? 'Could not send WhatsApp.' : 'No se pudo enviar WhatsApp.'))
      } else {
        setHandoffNotice(isEn ? 'Sent. An advisor will contact you.' : 'Enviado. Un asesor le contactará.')
      }
    } catch {
      setHandoffNotice(isEn ? 'Could not send WhatsApp.' : 'No se pudo enviar WhatsApp.')
    } finally {
      setHandoffLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div className="w-[92vw] max-w-sm overflow-hidden rounded-none border border-stone-200/90 bg-white shadow-[0_24px_70px_-16px_rgba(15,23,42,0.35)] ring-1 ring-stone-900/[0.06]">
          <div className="relative overflow-hidden border-b border-teal-500/25 bg-gradient-to-r from-stone-950 via-stone-900 to-teal-950 px-4 py-3.5 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_100%_-20%,rgba(45,212,191,0.18),transparent_50%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.06)_0%,transparent_45%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center border border-teal-400/35 bg-teal-500/15 backdrop-blur-sm">
                  <AssistantFabIcon className="h-7 w-7" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-white">
                    {isEn ? 'Store assistant' : 'Asistente de tienda'}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-teal-100/85">
                    {isEn ? 'AI · products, cart & stores' : 'IA · productos, carrito y tiendas'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 border border-white/15 bg-white/5 px-2 py-1 text-lg leading-none text-stone-300 transition hover:bg-white/10 hover:text-white"
                aria-label={isEn ? 'Close chat' : 'Cerrar chat'}
              >
                ✕
              </button>
            </div>
          </div>

          <div
            ref={listRef}
            className="max-h-80 space-y-3 overflow-y-auto bg-gradient-to-b from-stone-100/95 via-stone-50 to-white p-3"
          >
            {itemsUi.map((item, i) => (
              <div
                key={`${item.role}-${i}`}
                className={[
                  'max-w-[90%] rounded-none px-3 py-2.5 text-sm leading-relaxed',
                  item.role === 'assistant'
                    ? 'border border-stone-200/90 bg-white/95 text-stone-800 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.12)] ring-1 ring-stone-900/[0.04]'
                    : 'ml-auto border border-teal-900/20 bg-gradient-to-br from-stone-800 to-stone-900 text-white shadow-md ring-1 ring-white/10',
                ].join(' ')}
              >
                {item.role === 'assistant' ? (
                  <span className="mr-2 inline-block h-2 w-0.5 translate-y-px bg-teal-500 align-middle" aria-hidden />
                ) : null}
                {item.text}
              </div>
            ))}
            {loading ? (
              <div className="max-w-[90%] rounded-none border border-stone-200/90 bg-white/95 px-3 py-2.5 text-sm text-teal-800/80 shadow-sm ring-1 ring-stone-900/[0.04]">
                <span className="mr-2 inline-block h-2 w-0.5 translate-y-px bg-teal-400 align-middle" aria-hidden />
                {isEn ? 'Typing…' : 'Escribiendo…'}
              </div>
            ) : null}
          </div>

          <div className="border-t border-stone-200/90 bg-white p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend()
                }}
                placeholder={isEn ? 'Type your question...' : 'Escriba su consulta...'}
                className="h-10 flex-1 rounded-none border border-stone-300 bg-stone-50/80 px-3 text-sm text-stone-900 outline-none ring-teal-500/0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/25"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="h-10 shrink-0 rounded-none bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-60"
              >
                {isEn ? 'Send' : 'Enviar'}
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                {isEn ? 'Your WhatsApp (optional)' : 'Su WhatsApp (opcional)'}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+506 8888 8888"
                className="h-10 rounded-none border border-stone-300 bg-stone-50/80 px-3 text-sm text-stone-900 outline-none ring-teal-500/0 transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/25"
              />
              <button
                type="button"
                onClick={requestAdvisor}
                disabled={handoffLoading}
                className="w-full rounded-none border border-emerald-700/90 bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
              >
                {handoffLoading ? (isEn ? 'Sending…' : 'Enviando…') : isEn ? 'Talk to an advisor on WhatsApp' : 'Hablar con un asesor por WhatsApp'}
              </button>
              {handoffNotice ? (
                <div className="rounded-none border border-teal-200 bg-teal-50 px-2 py-1.5 text-xs text-teal-900">{handoffNotice}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative inline-flex items-center gap-3 overflow-hidden border border-teal-400/35 bg-gradient-to-br from-stone-950 via-stone-900 to-teal-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_-12px_rgba(15,118,110,0.55)] transition hover:border-teal-300/50 hover:shadow-[0_18px_50px_-12px_rgba(20,184,166,0.45)]"
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_90%_-40%,rgba(45,212,191,0.22),transparent_55%)]" />
          <span className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
            <span className="absolute -left-1/2 top-0 h-full w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm" />
          </span>
          <span className="relative flex items-center gap-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center border border-teal-400/40 bg-teal-500/10">
              <AssistantFabIcon className="h-8 w-8" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-35" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400 ring-2 ring-stone-950" />
              </span>
            </span>
            <span className="relative text-left leading-tight">
              <span className="block tracking-tight">{isEn ? 'AI Assistant' : 'Asistente IA'}</span>
              <span className="mt-0.5 block text-[11px] font-medium text-teal-100/80">{isEn ? 'Tap to chat' : 'Toca para chatear'}</span>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
