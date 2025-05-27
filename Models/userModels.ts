import { conexion } from "./conexion.ts";
import { z } from "../Dependencies/dependencies.ts";

interface UsuarioData {
    idUsuario: number | null;
    nombre: string;
    apellido: string;
    urlImagen: string;
    documento: string;
    contrasena: string;
}

export class Usuario {
    public _objUsuario: UsuarioData | null;
    public _idUsuario: number | null;

    constructor(objUser: UsuarioData | null = null, idUsuario: number | null = null) {
        this._objUsuario = objUser;
        this._idUsuario = idUsuario;
    }

    public async SeleccionarUsuarios(): Promise<UsuarioData[]> {
        const { rows: users } = await conexion.execute("SELECT * FROM usuarios");
        return users as UsuarioData[];
    }

    public async SeleccionarUsuarioPorId(): Promise<UsuarioData | null> {
        if (!this._idUsuario) {
            throw new Error("No se ha proporcionado un ID de usuario válido");
        }
        
        const result = await conexion.query("SELECT * FROM usuarios WHERE idUsuario = ?", [this._idUsuario]);
        return result.length > 0 ? result[0] as UsuarioData : null;
    }

    public async InsertarUsuarios(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown> }> {
        try {
            if (!this._objUsuario) {
                throw new Error("No se ha proporcionado un objeto de usuario válido");
            }

            const { nombre, apellido, urlImagen, documento, contrasena } = this._objUsuario;
            if (!nombre || !apellido || !documento || !contrasena) {
                throw new Error("Faltan campos requeridos para insertar el usuario");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(
                `INSERT INTO usuarios (nombre, apellido, urlImagen, documento, contrasena) VALUES (?, ?, ?, ?, ?)`,
                [nombre, apellido, urlImagen || '', documento, contrasena]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                const [usuario] = await conexion.query(`SELECT * FROM usuarios WHERE idUsuario = LAST_INSERT_ID()`);
                await conexion.execute("COMMIT");
                return { success: true, message: "Usuario registrado correctamente.", usuario: usuario };
            } else {
                throw new Error("No fue posible registrar el usuario.");
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

    public async ActualizarUsuario(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown> }> {
        try {
            if (!this._objUsuario) {
                throw new Error("No se ha proporcionado un objeto de usuario válido");
            }

            const { nombre, apellido, urlImagen, documento, contrasena } = this._objUsuario;
            if (!nombre || !apellido || !documento || !contrasena) {
                throw new Error("Faltan campos requeridos para actualizar el usuario");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(
                `UPDATE usuarios SET nombre = ?, apellido = ?, urlImagen = ?, documento = ?, contrasena = ? WHERE idUsuario = ?`,
                [nombre, apellido, urlImagen || '', documento, contrasena, this._idUsuario]
            );

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                const [usuario] = await conexion.query(`SELECT * FROM usuarios WHERE idUsuario = ?`, [this._idUsuario]);
                return { success: true, message: "Usuario actualizado correctamente", usuario: usuario };
            } else {
                throw new Error("No fue posible actualizar el usuario.");
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

    public async EliminarUsuario(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this._idUsuario) {
                throw new Error("No se ha proporcionado un id de usuario válido");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`DELETE FROM usuarios WHERE idUsuario = ?`, [this._idUsuario]);

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return { success: true, message: "Usuario eliminado correctamente" };
            } else {
                throw new Error("No fue posible eliminar el usuario.");
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