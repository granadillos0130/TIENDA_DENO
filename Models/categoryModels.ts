import { conexion } from "./conexion.ts";
import { z } from "../Dependencies/dependencies.ts";

interface CategoriaData {
    idCategoria: number | null;
    nombreCategoria: string;
}

export class Categoria {
    public _objCategoria: CategoriaData | null;
    public _idCategoria: number | null;

    constructor(objCategory: CategoriaData | null = null, idCategoria: number | null = null) {
        this._objCategoria = objCategory;
        this._idCategoria = idCategoria;
    }

    public async SeleccionarCategorias(): Promise<CategoriaData[]> {
        const { rows: categorias } = await conexion.execute("SELECT * FROM categorias");
        return categorias as CategoriaData[];
    }

    public async InsertarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria) {
                throw new Error("No se ha proporcionado un objeto de categoria válido");
            }

            const { nombreCategoria } = this._objCategoria;
            if (!nombreCategoria) {
                throw new Error("Faltan campos requeridos para insertar la categoria");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`INSERT INTO categorias (nombreCategoria) VALUES (?)`, [
                nombreCategoria,
            ]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [categoria] = await conexion.query(`SELECT * FROM categorias WHERE idCategoria = LAST_INSERT_ID()`);
                await conexion.execute("COMMIT");
                return { success: true, message: "Categoria registrada correctamente.", categoria: categoria };
            } else {
                throw new Error("No fue posible registrar la categoria.");
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

    public async ActualizarCategoria(): Promise<{ success: boolean; message: string; categoria?: Record<string, unknown> }> {
        try {
            if (!this._objCategoria) {
                throw new Error("No se ha proporcionado un objeto de categoria válido");
            }

            const { nombreCategoria } = this._objCategoria;
            if (!nombreCategoria) {
                throw new Error("Faltan campos requeridos para actualizar la categoria");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`UPDATE categorias SET nombreCategoria = ? WHERE idCategoria = ?`, [
                nombreCategoria,
                this._idCategoria,
            ]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                const [categoria] = await conexion.query(`SELECT * FROM categorias WHERE idCategoria = ?`, [this._idCategoria]);
                return { success: true, message: "Categoria actualizada correctamente", categoria: categoria };
            } else {
                throw new Error("No fue posible actualizar la categoria.");
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

    public async EliminarCategoria(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this._idCategoria) {
                throw new Error("No se ha proporcionado un id de categoria válido");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`DELETE FROM categorias WHERE idCategoria = ?`, [this._idCategoria]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return { success: true, message: "Categoria eliminada correctamente" };
            } else {
                throw new Error("No fue posible eliminar la categoria.");
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