import { Router } from "../Dependencies/dependencies.ts";
import { send } from "https://deno.land/x/oak@v17.1.3/send.ts";

const staticRouter = new Router();

// Servir imágenes de usuarios
staticRouter.get("/uploads/users/:filename", async (ctx) => {
    const filename = ctx.params.filename;
    try {
        await send(ctx, filename, {
            root: "./uploads/users",
        });
    } catch {
        ctx.response.status = 404;
        ctx.response.body = { error: "Archivo no encontrado" };
    }
});

// Servir imágenes de productos
staticRouter.get("/uploads/products/:filename", async (ctx) => {
    const filename = ctx.params.filename;
    try {
        await send(ctx, filename, {
            root: "./uploads/products",
        });
    } catch {
        ctx.response.status = 404;
        ctx.response.body = { error: "Archivo no encontrado" };
    }
});

export { staticRouter };