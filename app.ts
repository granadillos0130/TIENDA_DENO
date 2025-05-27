import { Application, oakCors } from "./Dependencies/dependencies.ts";
import { routerUser } from "./Routes/userRouter.ts";
import { routerProduct } from "./Routes/productRouter.ts";
import { routerShopping } from "./Routes/shoppingRouter.ts";
import { routerCategory } from "./Routes/categoryRouter.ts";
import { staticRouter } from "./Routes/staticFiles.ts";

const app = new Application();
app.use(oakCors()); // Habilitar CORS para todas las rutas

const routers = [routerUser, routerProduct, routerShopping, routerCategory, staticRouter];

routers.forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());
});

console.log("Server running on port 8000");
await app.listen({ port: 8000 });