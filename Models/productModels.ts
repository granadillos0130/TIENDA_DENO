import { conexion } from "./conexion.ts";
import { z } from "../Dependencies/dependencies.ts";

interface ProductoData {
    idProducto: number | null;
    cantidad: number;
    descripcion: string;
    precio: number;
    unidad: string;
    urlImagen: string;
    idCategoria: number | null;
}

export class Producto {
    public _objProducto: ProductoData | null;
    public _idProducto: number | null;

    constructor(objProducto: ProductoData | null = null, idProducto: number | null = null) {
        this._objProducto = objProducto;
        this._idProducto = idProducto;
    }

    public async SeleccionarProductos(): Promise<ProductoData[]> {
        const { rows: productos } = await conexion.execute("SELECT * FROM productos");
        return productos as ProductoData[];
    }

    public async InsertarProducto(): Promise<{ success: boolean; message: string; producto?: Record<string, unknown> }> {
        try {
            if (!this._objProducto) {
                throw new Error("No se ha proporcionado un objeto de producto válido");
            }

            const { cantidad, descripcion, precio, unidad, urlImagen, idCategoria } = this._objProducto;
            if (!descripcion || !precio || !unidad || !idCategoria) {
                throw new Error("Faltan campos requeridos para insertar el producto");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`INSERT INTO productos (cantidad, descripcion, precio, unidad, urlImagen, idCategoria) VALUES (?, ?, ?, ?, ?, ?)`, [
                cantidad,
                descripcion,
                precio,
                unidad,
                urlImagen,
                idCategoria,
            ]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [producto] = await conexion.query(`SELECT * FROM productos WHERE idProducto = LAST_INSERT_ID()`);
                await conexion.execute("COMMIT");
                return { success: true, message: "Producto registrado correctamente.", producto: producto };
            } else {
                throw new Error("No fue posible registrar el producto.");
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message }
            } else {
                return { success: false, message: "Error interno del servidor" };
            }
        }
    }

    public async ActualizarProducto(): Promise<{ success: boolean; message: string; producto?: Record<string, unknown> }> {
        try {
            if (!this._objProducto) {
                throw new Error("No se ha proporcionado un objeto de producto válido");
            }

            const { cantidad, descripcion, precio, unidad, urlImagen, idCategoria } = this._objProducto;
            if (!descripcion || !precio || !unidad || !idCategoria) {
                throw new Error("Faltan campos requeridos para actualizar el producto");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`UPDATE productos SET cantidad = ?, descripcion = ?, precio = ?, unidad = ?, urlImagen = ?, idCategoria = ? WHERE idProducto = ?`, [
                cantidad,
                descripcion,
                precio,
                unidad,
                urlImagen,
                idCategoria,
                this._idProducto,
            ]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                const [producto] = await conexion.query(`SELECT * FROM productos WHERE idProducto = ?`, [this._idProducto]);
                return { success: true, message: "Producto actualizado correctamente", producto: producto };
            } else {
                throw new Error("No fue posible actualizar el producto.");
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message }
            } else {
                return { success: false, message: "Error interno del servidor" };
            }
        }
    }

    public async EliminarProducto(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this._idProducto) {
                throw new Error("No se ha proporcionado un id de producto válido");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`DELETE FROM productos WHERE idProducto = ?`, [this._idProducto]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return { success: true, message: "Producto eliminado correctamente" };
            } else {
                throw new Error("No fue posible eliminar el producto.");
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message }
            } else {
                return { success: false, message: "Error interno del servidor" };
            }
        }
    }
    public async SeleccionarProductoPorId(): Promise<ProductoData | null> {
    if (!this._idProducto) {
        throw new Error("No se ha proporcionado un ID de producto válido");
    }
    
    const result = await conexion.query("SELECT * FROM productos WHERE idProducto = ?", [this._idProducto]);
    return result.length > 0 ? result[0] as ProductoData : null;
}
}