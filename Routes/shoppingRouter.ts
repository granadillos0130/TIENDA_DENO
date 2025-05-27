import { Router } from "../Dependencies/dependencies.ts";
import { getShopping,postShopping,putShopping,deleteShopping} from "../Controllers/shoppingController.ts";


const routerShopping = new Router();
routerShopping.get("/carrito", getShopping);
routerShopping.post("/carrito", postShopping);
routerShopping.put("/carrito", putShopping);
routerShopping.delete("/carrito", deleteShopping);
export {routerShopping};