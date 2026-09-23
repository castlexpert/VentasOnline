"use strict";

/** @param {import('sequelize').QueryInterface} qi */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(qi) {
    await qi.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_lang AS ENUM ('ESPA', 'ENGL');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE enum_tip_user AS ENUM ('LOCAL', 'GOOGLE');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE enum_status AS ENUM ('ACTIVO', 'INACTIVO');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE enum_quote_status AS ENUM ('Solicitada','Enviada','Error','Atendida');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "W1_product_category" (
        "id_category" SERIAL PRIMARY KEY,
        "des_category" VARCHAR(255) NOT NULL,
        "language" enum_lang NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "W1_product" (
        "id_product" SERIAL PRIMARY KEY,
        "id_category" INTEGER NOT NULL REFERENCES "W1_product_category"("id_category") ON UPDATE CASCADE ON DELETE RESTRICT,
        "name_product" VARCHAR(255),
        "desc_product" TEXT,
        "det_product" TEXT,
        "amount" DECIMAL(10,2),
        "language" enum_lang NOT NULL,
        "img_path_name" VARCHAR(512),
        "pdf_path_name" VARCHAR(512)
      );
      CREATE INDEX IF NOT EXISTS idx_w1_product_category ON "W1_product" ("id_category");
      CREATE INDEX IF NOT EXISTS idx_w1_product_lang ON "W1_product" ("language");

      CREATE TABLE IF NOT EXISTS "W1_plant" (
        "id_plant" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "address" TEXT NOT NULL,
        "phone" VARCHAR(64) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "createdAt" DATE NOT NULL DEFAULT (CURRENT_DATE)
      );

      CREATE TABLE IF NOT EXISTS "W1_user_admin" (
        "user" VARCHAR(128) PRIMARY KEY,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255),
        "apellido1" VARCHAR(255),
        "apellido2" VARCHAR(255),
        "phone" VARCHAR(64),
        "phone2" VARCHAR(64),
        "direccion" VARCHAR(512),
        "ind_tip_user" enum_tip_user NOT NULL,
        "ind_status" enum_status NOT NULL DEFAULT 'ACTIVO'
      );

      CREATE TABLE IF NOT EXISTS "W1_user_quote" (
        "user_quote" VARCHAR(255) PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "apellido1" VARCHAR(255) NOT NULL,
        "apellido2" VARCHAR(255),
        "phone" VARCHAR(64) NOT NULL,
        "phone2" VARCHAR(64),
        "direccion" VARCHAR(512),
        "ind_sync" BOOLEAN NOT NULL DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS "W1_quoter" (
        "email_quoter" VARCHAR(255) NOT NULL,
        "id_plant" INTEGER NOT NULL REFERENCES "W1_plant"("id_plant") ON UPDATE CASCADE ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "apellido1" VARCHAR(255),
        "apellido2" VARCHAR(255),
        "phone" VARCHAR(64),
        "phone2" VARCHAR(64),
        "address" TEXT,
        "cc_email" VARCHAR(1024),
        PRIMARY KEY ("email_quoter", "id_plant")
      );

      CREATE TABLE IF NOT EXISTS "W1_quote" (
        "user_quote" VARCHAR(255) NOT NULL REFERENCES "W1_user_quote"("user_quote") ON UPDATE CASCADE ON DELETE CASCADE,
        "quote_id" SERIAL NOT NULL,
        "id_plant" INTEGER NOT NULL REFERENCES "W1_plant"("id_plant") ON UPDATE CASCADE ON DELETE RESTRICT,
        "id_product" INTEGER NOT NULL REFERENCES "W1_product"("id_product") ON UPDATE CASCADE ON DELETE RESTRICT,
        "id_category" INTEGER NOT NULL REFERENCES "W1_product_category"("id_category") ON UPDATE CASCADE ON DELETE RESTRICT,
        "quote_status" enum_quote_status NOT NULL DEFAULT 'Solicitada',
        "send_detail" TEXT,
        "det_quote" TEXT,
        "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "date_quote" DATE NOT NULL DEFAULT (CURRENT_DATE),
        "date_last_sync" DATE,
        PRIMARY KEY ("user_quote", "quote_id")
      );
      CREATE INDEX IF NOT EXISTS idx_w1_quote_plant ON "W1_quote" ("id_plant");
      CREATE INDEX IF NOT EXISTS idx_w1_quote_status ON "W1_quote" ("quote_status");
      CREATE INDEX IF NOT EXISTS idx_w1_quote_date ON "W1_quote" ("date_quote");

      CREATE TABLE IF NOT EXISTS "session" (
        "sid" VARCHAR(36) NOT NULL PRIMARY KEY,
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
  },

  async down(qi) {
    await qi.sequelize.query(`
      DROP TABLE IF EXISTS "W1_quote";
      DROP TABLE IF EXISTS "W1_quoter";
      DROP TABLE IF EXISTS "W1_user_quote";
      DROP TABLE IF EXISTS "W1_user_admin";
      DROP TABLE IF EXISTS "W1_product";
      DROP TABLE IF EXISTS "W1_product_category";
      DROP TABLE IF EXISTS "W1_plant";
      DROP TABLE IF EXISTS "session";
      DROP TYPE IF EXISTS enum_quote_status;
      DROP TYPE IF EXISTS enum_status;
      DROP TYPE IF EXISTS enum_tip_user;
      DROP TYPE IF EXISTS enum_lang;
    `);
  }
};
