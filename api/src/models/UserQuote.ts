import { DataTypes, Model, type Sequelize } from "sequelize";
import type { Quote } from "./Quote.js";

export class UserQuote extends Model {
  declare user_quote: string;
  declare name: string;
  declare apellido1: string;
  declare apellido2: string | null;
  declare phone: string;
  declare phone2: string | null;
  declare direccion: string | null;
  declare ind_sync: boolean;
  declare quotes?: Quote[];
}

export function initUserQuote(sequelize: Sequelize) {
  UserQuote.init(
    {
      user_quote: { type: DataTypes.STRING(255), primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      apellido1: { type: DataTypes.STRING(255), allowNull: false },
      apellido2: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(64), allowNull: false },
      phone2: { type: DataTypes.STRING(64), allowNull: true },
      direccion: { type: DataTypes.STRING(512), allowNull: true },
      ind_sync: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    { sequelize, tableName: "W1_user_quote", timestamps: false }
  );
}
