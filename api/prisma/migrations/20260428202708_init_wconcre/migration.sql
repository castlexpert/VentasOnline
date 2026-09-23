-- CreateTable
CREATE TABLE "w1_page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "w1_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "w1_plant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "w1_plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "w1_housing_model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "heroImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "w1_housing_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "w1_product_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "w1_product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "w1_product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "body" JSONB,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "w1_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "w1_quote_request" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "plant" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "w1_quote_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "w1_page_slug_key" ON "w1_page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "w1_product_category_name_key" ON "w1_product_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "w1_product_category_slug_key" ON "w1_product_category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "w1_product_slug_key" ON "w1_product"("slug");

-- AddForeignKey
ALTER TABLE "w1_product" ADD CONSTRAINT "w1_product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "w1_product_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
