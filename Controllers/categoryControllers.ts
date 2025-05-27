// deno-lint-ignore-file
import { Categoria } from "../Models/categoryModels.ts";

export const getCategory = async (ctx: any) => {
    const { response } = ctx;

    try {
        const objCategoria = new Categoria();
        const listaCategorias = await objCategoria.SeleccionarCategorias();
        response.status = 200;
        response.body = { success: true, data: listaCategorias };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const postCategory = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");
        
        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        const CategoryData = {
            idCategoria: null,
            nombreCategoria: body.nombreCategoria
        }

        const objCategory = new Categoria(CategoryData);
        const result = await objCategory.InsertarCategoria();
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const putCategory = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        const CategoryData = {
            idCategoria: body.idCategoria,
            nombreCategoria: body.nombreCategoria
        }

        const objCategory = new Categoria(CategoryData, body.idCategoria);
        const result = await objCategory.ActualizarCategoria();
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const deleteCategory = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        const objCategory = new Categoria(null, body.idCategoria);
        const result = await objCategory.EliminarCategoria();
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}