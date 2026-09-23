import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.page.upsert({
    where: { slug: "nuestra-empresa" },
    update: {},
    create: {
      slug: "nuestra-empresa",
      title: "Nuestra empresa",
      body: {
        sections: [
          {
            type: "richText",
            title: "Nuestra empresa",
            paragraphs: [
              "Grupo Concrepal nació en 1958 como una pequeña empresa familiar de capital 100% costarricense.",
              "Actualmente, después de más de 60 años, Concrepal abastece el mercado nacional con 4 plantas de producción."
            ]
          },
          {
            type: "list",
            title: "Categorías de procesos productivos",
            items: [
              "Industria de Prefabricados de Concreto",
              "Extracción y Trituración de Agregados",
              "Sistemas constructivos modulares",
              "Venta y producción de materiales de concreto"
            ]
          }
        ]
      }
    }
  });

  await prisma.plant.createMany({
    data: [
      {
        name: "CONCREPAL PALMARES",
        address:
          "Carretera Vieja de Naranjo, 800 este de la escuela Buenos Aires, Provincia de Alajuela, Palmares",
        phone: "+506 2453 0133",
        email: "info@concrepal.net"
      },
      {
        name: "CONCREPAL BARRANCA",
        address: "Carmen Lyra, Provincia de Puntarenas, Barranca",
        phone: "+506 2453 0133",
        email: "info@concrepal.net"
      },
      {
        name: "CONCREPAL PARRITA",
        address:
          "De la Cooperativa Coopecalifornia, 6 Kms al Norte, Frente a la Arrocera Cooparroz R.L., Playón Sur de Parrita, Provincia de Puntarenas",
        phone: "+506 2453 0133",
        email: "info@concrepal.net"
      },
      {
        name: "CONCREPAL LIBERIA",
        address:
          "Frente a la entrada del Pelón de la Bajura, Provincia de Guanacaste, Bagaces",
        phone: "+506 2453 0133",
        email: "info@concrepal.net"
      }
    ],
    skipDuplicates: true
  });

  const catalog = Array.from({ length: 15 }).map((_, i) => ({
    name: `Modelo ${i + 1}`
  }));
  await prisma.housingModel.createMany({ data: catalog, skipDuplicates: true });

  const categories = [
    { name: "Bloques", slug: "bloques" },
    { name: "Adoquines y Pisos Exteriores", slug: "adoquines" },
    { name: "Tapias Prefabricadas", slug: "tapias" },
    { name: "Tubos y Cunetas", slug: "tubos-y-cunetas" },
    { name: "Sistemas Constructivos", slug: "sistemas-constructivos" }
  ];

  for (const c of categories) {
    await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c
    });
  }

  const bloques = await prisma.productCategory.findUniqueOrThrow({
    where: { slug: "bloques" }
  });

  await prisma.product.upsert({
    where: { slug: "bloques-de-concreto" },
    update: {},
    create: {
      categoryId: bloques.id,
      name: "Bloques de Concreto",
      slug: "bloques-de-concreto",
      description:
        "Bloques de concreto para construcción con especificaciones técnicas.",
      body: {
        items: [
          {
            name: "Block 12",
            weightKg: 11,
            resistanceAvgKgCm2: 133,
            resistanceMinKgCm2: 120,
            unitsPerM2: 12.5
          },
          {
            name: "Block 15",
            weightKg: 13,
            resistanceAvgKgCm2: 133,
            resistanceMinKgCm2: 120,
            unitsPerM2: 12.5
          },
          {
            name: "Block 20",
            weightKg: 17,
            resistanceAvgKgCm2: 133,
            resistanceMinKgCm2: 120,
            unitsPerM2: 12.5
          },
          {
            name: "Block Columna",
            weightKg: 19,
            resistanceAvgKgCm2: 133,
            resistanceMinKgCm2: 120,
            unitsPerM2: 12.5
          }
        ]
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

