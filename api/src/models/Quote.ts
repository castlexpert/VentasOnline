import { DataTypes, Model, type Sequelize } from "sequelize";
import type { UserQuote } from "./UserQuote.js";
import type { Store } from "./Store.js";
import type { Product } from "./Product.js";
import type { ProductCategory } from "./ProductCategory.js";

export class Quote extends Model {
  declare user_quote: string;
  declare quote_id: number;
  declare id_store: number;
  declare id_product: number;
  declare id_category: number;
  declare quote_status: "Solicitada" | "Enviada" | "Error" | "Atendida";
  declare send_detail: string | null;
  declare det_quote: string | null;
  declare total_amount: string;
  declare date_quote: Date;
  declare date_last_sync: Date | null;
  declare user?: UserQuote;
  declare store?: Store;
  declare product?: Product;
  declare category?: ProductCategory;
}

export function initQuote(sequelize: Sequelize) {
  Quote.init(
    {
      user_quote: { type: DataTypes.STRING(255), primaryKey: true },
      quote_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "quote_id" },
      id_store: { type: DataTypes.INTEGER, allowNull: false },
      id_product: { type: DataTypes.INTEGER, allowNull: false },
      id_category: { type: DataTypes.INTEGER, allowNull: false },
      quote_status: {
        type: DataTypes.ENUM("Solicitada", "Enviada", "Error", "Atendida"),
        allowNull: false,
        defaultValue: "Solicitada"
      },
      send_detail: { type: DataTypes.TEXT, allowNull: true },
      det_quote: { type: DataTypes.TEXT, allowNull: true },
      total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      date_quote: { type: DataTypes.DATEONLY, allowNull: false },
      date_last_sync: { type: DataTypes.DATEONLY, allowNull: true }
    },
    { sequelize, tableName: "W1_quote", timestamps: false }
  );
}
