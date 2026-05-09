import { Router } from "express";
import {
  fetchCategories,
  fetchCategoryById,
  addCategory,
  editCategory,
  removeCategory,
} from '../Controller/AdminProductCategoryController'

const router = Router();

router.get("/", fetchCategories);
router.get("/:id", fetchCategoryById);
router.post("/", addCategory);
router.put("/:id", editCategory);
router.delete("/:id", removeCategory);

export default router;