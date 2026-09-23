import type { Sequelize } from "sequelize";
import { initProductCategory, ProductCategory } from "./ProductCategory.js";
import { initProduct, Product } from "./Product.js";
import { initStore, Store } from "./Store.js";
import { initUserAdmin, UserAdmin } from "./UserAdmin.js";
import { initUserQuote, UserQuote } from "./UserQuote.js";
import { initQuoter, Quoter } from "./Quoter.js";
import { initQuote, Quote } from "./Quote.js";

export function initModels(sequelize: Sequelize) {
  initProductCategory(sequelize);
  initProduct(sequelize);
  initStore(sequelize);
  initUserAdmin(sequelize);
  initUserQuote(sequelize);
  initQuoter(sequelize);
  initQuote(sequelize);

  Product.belongsTo(ProductCategory, { foreignKey: "id_category", as: "category" });
  ProductCategory.hasMany(Product, { foreignKey: "id_category", as: "products" });

  Quoter.belongsTo(Store, { foreignKey: "id_store", as: "store" });
  Store.hasMany(Quoter, { foreignKey: "id_store", as: "quoters" });

  Quote.belongsTo(UserQuote, { foreignKey: "user_quote", as: "quoteUser" });
  UserQuote.hasMany(Quote, { foreignKey: "user_quote", as: "quotes" });

  Quote.belongsTo(Store, { foreignKey: "id_store", as: "store" });
  Quote.belongsTo(Product, { foreignKey: "id_product", as: "product" });
  Quote.belongsTo(ProductCategory, { foreignKey: "id_category", as: "category" });
}

export { ProductCategory, Product, Store, UserAdmin, UserQuote, Quoter, Quote };
