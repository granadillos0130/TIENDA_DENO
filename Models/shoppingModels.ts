import { conexion } from "./conexion.ts";
import { z } from "../Dependencies/dependencies.ts";

interface CompraData {
    idCompra: number | null;
    idUsuario: number | null;
    idProducto: number | null;
}

export class Compra {
    public _objCompra: CompraData | null;
    public _idCompra: number | null;

    constructor(objCompra: CompraData | null = null, idCompra: number | null = null) {
        this._objCompra = objCompra;
        this._idCompra = idCompra;
    }

    public async SeleccionarCompras(): Promise<CompraData[]> {
        const { rows: compras } = await conexion.execute("SELECT * FROM compras");
        return compras as CompraData[];
    }

    public async InsertarCompra(): Promise<{ success: boolean; message: string; compra?: Record<string, unknown> }> {
        try {
            if (!this._objCompra) {
                throw new Error("No se ha proporcionado un objeto de compra válido");
            }

            const { idUsuario, idProducto } = this._objCompra;
            if (!idUsuario || !idProducto) {
                throw new Error("Faltan campos requeridos para insertar la compra");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`INSERT INTO compras (idUsuario, idProducto) VALUES (?, ?)`, [
                idUsuario,
                idProducto,
            ]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [compra] = await conexion.query(`SELECT * FROM compras WHERE idCompra = LAST_INSERT_ID()`);
                await conexion.execute("COMMIT");
                return { success: true, message: "Compra registrada correctamente.", compra: compra };
            } else {
                throw new Error("No fue posible registrar la compra.");
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

    public async ActualizarCompra(): Promise<{ success: boolean; message: string; compra?: Record<string, unknown> }> {
        try {
            if (!this._objCompra) {
                throw new Error("No se ha proporcionado un objeto de compra válido");
            }

            const { idUsuario, idProducto } = this._objCompra;
            if (!idUsuario || !idProducto) {
                throw new Error("Faltan campos requeridos para actualizar la compra");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`UPDATE compras SET idUsuario = ?, idProducto = ? WHERE idCompra = ?`, [
                idUsuario,
                idProducto,
                this._idCompra,
            ]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                const [compra] = await conexion.query(`SELECT * FROM compras WHERE idCompra = ?`, [this._idCompra]);
                return { success: true, message: "Compra actualizada correctamente", compra: compra };
            } else {
                throw new Error("No fue posible actualizar la compra.");
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

    public async EliminarCompra(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this._idCompra) {
                throw new Error("No se ha proporcionado un id de compra válido");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`DELETE FROM compras WHERE idCompra = ?`, [this._idCompra]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return { success: true, message: "Compra eliminada correctamente" };
            } else {
                throw new Error("No fue posible eliminar la compra.");
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
}