import { Router } from "../Dependencies/dependencies.ts";
import { getProduct,postProduct,putProduct,deleteProduct } from "../Controllers/productControllers.ts";


const routerProduct = new Router();
routerProduct.get("/productos", getProduct);
routerProduct.post("/productos", postProduct);
routerProduct.put("/productos", putProduct);
routerProduct.delete("/productos", deleteProduct);
export {routerProduct};