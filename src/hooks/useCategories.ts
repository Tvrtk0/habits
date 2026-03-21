import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { Category } from "../models/types";

export function useCategories() {
  const categories = useLiveQuery(() =>
    db.categories.orderBy("sortOrder").toArray(),
  );

  async function addCategory(name: string, color: string): Promise<Category> {
    const count = (await db.categories.count()) || 0;
    const cat: Category = {
      id: crypto.randomUUID(),
      name,
      color,
      sortOrder: count,
    };
    await db.categories.add(cat);
    return cat;
  }

  return { categories, addCategory };
}
