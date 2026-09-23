import { BRAND_NAME, WHATSAPP_WA_ME_DIGITS } from '../constants/brand'

export function buildProductWhatsAppMessage(params: {
  isEn: boolean
  productName: string
  productId: number
  category?: string | null
  referencePriceColon?: string | number | null
  productAbsoluteUrl: string
}): string {
  const { isEn, productName, productId, category, referencePriceColon, productAbsoluteUrl } = params

  const priceLine =
    referencePriceColon != null && String(referencePriceColon).trim() !== ''
      ? isEn
        ? `Reference price (₡): ${referencePriceColon}`
        : `Precio referencia (₡): ${referencePriceColon}`
      : isEn
        ? 'Price: ask in chat'
        : 'Precio: consultar por chat'

  if (isEn) {
    return [
      `Hi ${BRAND_NAME}, I'd like more information about:`,
      '',
      `Product: ${productName}`,
      `ID: ${productId}`,
      category ? `Category: ${category}` : '',
      priceLine,
      `Link: ${productAbsoluteUrl}`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  return [
    `Hola ${BRAND_NAME}, solicito más información sobre:`,
    '',
    `Producto: ${productName}`,
    `ID: ${productId}`,
    category ? `Categoría: ${category}` : '',
    priceLine,
    `Enlace: ${productAbsoluteUrl}`,
  ]
      .filter(Boolean)
      .join('\n')
}

export function whatsappProductHref(payload: Omit<Parameters<typeof buildProductWhatsAppMessage>[0], 'productAbsoluteUrl'> & { productAbsoluteUrl: string }) {
  const text = encodeURIComponent(buildProductWhatsAppMessage(payload))
  return `https://wa.me/${WHATSAPP_WA_ME_DIGITS}?text=${text}`
}
