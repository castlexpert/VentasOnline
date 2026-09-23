import { DataTypes, Model, type Sequelize } from "sequelize";
import type { Product } from "./Product.js";

export class ProductCategory extends Model {
  declare id_category: number;
  declare des_category: string;
  declare language: "ESPA" | "ENGL";
  declare products?: Product[];
}

export function initProductCategory(sequelize: Sequelize) {
  ProductCategory.init(
    {
      id_category: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "id_category"
      },
      des_category: { type: DataTypes.STRING(255), allowNull: false, field: "des_category" },
      language: { type: DataTypes.ENUM("ESPA", "ENGL"), allowNull: false }
    },
    { sequelize, tableName: "W1_product_category", timestamps: false }
  );
}
