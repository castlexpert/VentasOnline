/** Contenido estático mientras no exista modelo CMS en Sequelize. */
export const CMS_PAGES: Record<string, { slug: string; title: string; body: unknown }> = {
  "nuestra-empresa": {
    slug: "nuestra-empresa",
    title: "Nuestra empresa",
    body: {
      sections: [
        {
          type: "richText",
          title: "Tienda Online",
          paragraphs: [
            "Tienda Online ofrece una experiencia de compra sencilla con envíos y atención por canales digitales.",
            "Trabajamos con marcas y artículos seleccionados pensando en estilo, confort y precios en colones costarricenses."
          ]
        },
        {
          type: "list",
          title: "Lo que ofrecemos",
          items: [
            "Ropa y calzado para toda la familia",
            "Accesorios y artículos para el hogar",
            "Novedades y colecciones temporada a temporada",
            "Cotización y seguimiento desde la web"
          ]
        }
      ]
    }
  }
};
