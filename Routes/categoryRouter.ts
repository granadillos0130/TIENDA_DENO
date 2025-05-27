import { Router } from "../Dependencies/dependencies.ts";
import { getCategory,postCategory,putCategory,deleteCategory } from "../Controllers/categoryControllers.ts";


const routerCategory = new Router();
routerCategory.get("/categoria", getCategory);
routerCategory.post("/categoria", postCategory);
routerCategory.put("/categoria", putCategory);
routerCategory.delete("/categoria", deleteCategory);
export {routerCategory};