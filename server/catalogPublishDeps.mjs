import {
  createCategory,
  createProduct,
  listCategories,
  updateProduct,
} from "./catalog.mjs";
import { getSql } from "./db.mjs";

export function getCatalogPublishDeps() {
  const sql = getSql();

  return {
    listCategories,
    createCategory,
    createProduct,
    updateProduct,
    async runInTransaction(callback) {
      await sql`BEGIN`;
      try {
        const result = await callback();
        await sql`COMMIT`;
        return result;
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    },
  };
}
