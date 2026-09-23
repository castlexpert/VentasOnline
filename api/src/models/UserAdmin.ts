import { DataTypes, Model, type Sequelize } from "sequelize";

export class UserAdmin extends Model {
  declare user: string;
  declare password: string;
  declare name: string | null;
  declare apellido1: string | null;
  declare apellido2: string | null;
  declare phone: string | null;
  declare phone2: string | null;
  declare direccion: string | null;
  declare ind_tip_user: "LOCAL" | "GOOGLE";
  declare ind_status: "ACTIVO" | "INACTIVO";
}

export function initUserAdmin(sequelize: Sequelize) {
  UserAdmin.init(
    {
      user: { type: DataTypes.STRING(128), primaryKey: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      name: { type: DataTypes.STRING(255), allowNull: true },
      apellido1: { type: DataTypes.STRING(255), allowNull: true },
      apellido2: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(64), allowNull: true },
      phone2: { type: DataTypes.STRING(64), allowNull: true },
      direccion: { type: DataTypes.STRING(512), allowNull: true },
      ind_tip_user: { type: DataTypes.ENUM("LOCAL", "GOOGLE"), allowNull: false },
      ind_status: { type: DataTypes.ENUM("ACTIVO", "INACTIVO"), allowNull: false, defaultValue: "ACTIVO" }
    },
    { sequelize, tableName: "W1_user_admin", timestamps: false }
  );
}
