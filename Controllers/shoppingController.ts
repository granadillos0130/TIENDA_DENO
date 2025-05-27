import { Compra } from "../Models/shoppingModels.ts";

export const getShopping = async (ctx: any) => {
    const { response } = ctx;

    try {
        const objCompra = new Compra();
        const listaCompras = await objCompra.SeleccionarCompras();
        response.status = 200;
        response.body = { success: true, data: listaCompras };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const postShopping = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");
        
        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        const ShoppingData = {
            idCompra: null,
            idUsuario: body.idUsuario,
            idProducto: body.idProducto
        }

        const objShopping = new Compra(ShoppingData);
        const result = await objShopping.InsertarCompra();
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const putShopping = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        const ShoppingData = {
            idCompra: body.idCompra,
            idUsuario: body.idUsuario,
            idProducto: body.idProducto
        }

        const objShopping = new Compra(ShoppingData, body.idCompra);
        const result = await objShopping.ActualizarCompra();
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const deleteShopping = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        const objShopping = new Compra(null, body.idCompra);
        const result = await objShopping.EliminarCompra();
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}