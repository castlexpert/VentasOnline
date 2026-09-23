import { DataTypes, Model, type Sequelize } from "sequelize";
import type { ProductCategory } from "./ProductCategory.js";

export class Product extends Model {
  declare id_product: number;
  declare id_category: number;
  declare name_product: string | null;
  declare desc_product: string | null;
  declare det_product: string | null;
  declare amount: string | null;
  declare language: "ESPA" | "ENGL";
  declare img_path_name: string | null;
  declare pdf_path_name: string | null;
  declare category?: ProductCategory;
}

export function initProduct(sequelize: Sequelize) {
  Product.init(
    {
      id_product: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "id_product"
      },
      id_category: { type: DataTypes.INTEGER, allowNull: false, field: "id_category" },
      name_product: { type: DataTypes.STRING(255), allowNull: true },
      desc_product: { type: DataTypes.TEXT, allowNull: true },
      det_product: { type: DataTypes.TEXT, allowNull: true },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      language: { type: DataTypes.ENUM("ESPA", "ENGL"), allowNull: false },
      img_path_name: { type: DataTypes.STRING(512), allowNull: true },
      pdf_path_name: { type: DataTypes.STRING(512), allowNull: true }
    },
    { sequelize, tableName: "W1_product", timestamps: false }
  );
}
