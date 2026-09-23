import { DataTypes, Model, type Sequelize } from "sequelize";
import type { Quoter } from "./Quoter.js";

export class Store extends Model {
  declare id_store: number;
  declare name: string;
  declare address: string;
  declare phone: string;
  declare email: string;
  declare createdAt: Date;
  declare quoters?: Quoter[];
}

export function initStore(sequelize: Sequelize) {
  Store.init(
    {
      id_store: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "id_store"
      },
      name: { type: DataTypes.STRING(255), allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      phone: { type: DataTypes.STRING(64), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      createdAt: { type: DataTypes.DATEONLY, allowNull: false, field: "createdAt" }
    },
    { sequelize, tableName: "W1_store", updatedAt: false, createdAt: false }
  );
}
