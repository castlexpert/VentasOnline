import { DataTypes, Model, type Sequelize } from "sequelize";
import type { Store } from "./Store.js";

export class Quoter extends Model {
  declare email_quoter: string;
  declare id_store: number;
  declare name: string;
  declare apellido1: string | null;
  declare apellido2: string | null;
  declare phone: string | null;
  declare phone2: string | null;
  declare address: string | null;
  declare cc_email: string | null;
  declare store?: Store;
}

export function initQuoter(sequelize: Sequelize) {
  Quoter.init(
    {
      email_quoter: { type: DataTypes.STRING(255), primaryKey: true },
      id_store: { type: DataTypes.INTEGER, primaryKey: true, field: "id_store" },
      name: { type: DataTypes.STRING(255), allowNull: false },
      apellido1: { type: DataTypes.STRING(255), allowNull: true },
      apellido2: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(64), allowNull: true },
      phone2: { type: DataTypes.STRING(64), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      cc_email: { type: DataTypes.STRING(1024), allowNull: true }
    },
    { sequelize, tableName: "W1_quoter", timestamps: false }
  );
}
