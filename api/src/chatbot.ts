/** Fallback rápido sin LLM cuando OPENAI_API_KEY no está configurada. */

function classify(msg: string) {
  const m = msg.toLowerCase();

  if (m.includes("hola") || m.includes("buenas") || m.includes("hey") || m.includes("hi ") || m === "hi") {
    return "GREETING";
  }
  if (m.includes("inicio") || m.includes("principal") || m.includes("landing")) {
    return "HOME";
  }
  if (m.includes("contacto") || m.includes("+506") || m.includes("correo") || m.includes("@")) {
    return "CONTACT";
  }
  if (m.includes("ubicacion") || m.includes("tienda") || m.includes("planta") || m.includes("donde")) {
    return "STORES";
  }
  if (m.includes("empresa") || m.includes("mision")) {
    return "COMPANY";
  }
  if (m.includes("cotizacion") || m.includes("cotiz") || m.includes("carrito")) {
    return "QUOTE";
  }
  if (
    m.includes("product") ||
    m.includes("precio") ||
    m.includes("categor") ||
    m.includes("vestido") ||
    m.includes("remera") ||
    m.includes("ropa")
  ) {
    return "PRODUCTS";
  }

  return "OTHER";
}

export function fallbackReplySpanish(msg: string) {
  const kind = classify(msg);
  switch (kind) {
    case "GREETING":
      return "Hola, bienvenido a Tienda Online. ¿En qué colección o producto le puedo ayudar? También puede ir a Cotización para armar su pedido.";
    case "HOME":
      return "En Inicio verá destacados en colones y acceso a colecciones. Use el menú Tienda para Mujer, Hombre, Niños, Accesorios y Hogar.";
    case "CONTACT":
      return "Escríbanos a hola@tiendaonline.demo o al +506 4000 1000. También encuentre tiendas y correos locales en Contacto.";
    case "STORES":
      return "Tenemos ubicaciones tipo Metro, Escazú, Heredia y Cartago. Abra Contacto para ver direcciones y teléfonos.";
    case "QUOTE":
      return "Para cotizar, puede usar el formulario de cotización y elegir tienda. Si indica los productos, le guío paso a paso.";
    case "PRODUCTS":
      return "El catálogo está en Productos: ahí puede filtrar por colección. Los precios de referencia se muestran en colones donde aplique.";
    case "COMPANY":
      return "En Nuestra empresa puede conocer nuestra propuesta Tienda Online: moda, hogar y atención en colones.";
    default:
      return "Soy Tienda Online. Puedo orientar sobre productos, ubicaciones y cotización. ¿Qué busca hoy?";
  }
}

export function generateChatbotReply(
  history: { role: string; content: string }[] | string,
  languageHint?: "es" | "en"
) {
  const message =
    typeof history === "string"
      ? history
      : [...history].reverse().find((m) => m.role === "user")?.content?.trim() || "";

  const m = message.toLowerCase();

  const shouldAnswerInEnglish =
    languageHint === "en" ||
    (/^[a-z0-9\s.,!?`'"\-]+$/.test(m) &&
      m.length >= 12 &&
      !m.includes("á") &&
      !m.includes("é") &&
      !m.includes("í") &&
      !m.includes("ó") &&
      !m.includes("ú") &&
      !m.includes("ñ") &&
      !m.includes("¿") &&
      !m.includes("¡"));

  if (!shouldAnswerInEnglish) return fallbackReplySpanish(message);

  const classifyEn = classify(m);
  if (classifyEn === "GREETING") return "Welcome to Tienda Online. How can I help with collections, stores, or checkout?";

  switch (classify(m)) {
    case "CONTACT":
      return "Email hola@tiendaonline.demo or call +506 4000 1000. Stores and local numbers are on the Stores page.";
    case "QUOTE":
      return "Use Quotes to attach items and choose a pickup store. Tell me SKUs if you need help navigating.";
    case "PRODUCTS":
      return "Browse Products by collection. Reference prices appear in Costa Rican colones where listed.";
    case "STORES":
      return "We list Metro, Escazú, Heredia and Cartago-style locations — see Contact for addresses.";
    default:
      return "I am Tienda Online assistant. Ask about catalog, pickup stores or quotes.";
  }
}
