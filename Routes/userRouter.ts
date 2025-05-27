import { Router } from "../Dependencies/dependencies.ts";
import { getUsers,postUsers,putUsers,deleteUsers } from "../Controllers/userControllers.ts";


const routerUser = new Router();
routerUser.get("/usuarios", getUsers);
routerUser.post("/usuarios", postUsers);
routerUser.put("/usuarios", putUsers);
routerUser.delete("/usuarios", deleteUsers);
export {routerUser};