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
            console.log("🚀 InsertarUsuarios - Iniciando inserción");
            console.log("📊 Datos recibidos:", this._objUsuario);

            if (!this._objUsuario) {
                throw new Error("No se ha proporcionado un objeto de usuario válido");
            }

            const { nombre, apellido, urlImagen, documento, contrasena } = this._objUsuario;
            
            console.log("🔍 Validando campos:");
            console.log("  - nombre:", nombre ? "✅" : "❌");
            console.log("  - apellido:", apellido ? "✅" : "❌");
            console.log("  - documento:", documento ? "✅" : "❌");
            console.log("  - contrasena:", contrasena ? "✅" : "❌");
            console.log("  - urlImagen:", urlImagen || "(vacío)");

            if (!nombre || !apellido || !documento || !contrasena) {
                throw new Error("Faltan campos requeridos para insertar el usuario");
            }

            console.log("💾 Iniciando transacción...");
            await conexion.execute("START TRANSACTION");

            const sqlQuery = `INSERT INTO usuarios (nombre, apellido, urlImagen, documento, contrasena) VALUES (?, ?, ?, ?, ?)`;
            const sqlParams = [nombre, apellido, urlImagen || '', documento, contrasena];
            
            console.log("📝 SQL Query:", sqlQuery);
            console.log("📋 SQL Params:", sqlParams);

            const result = await conexion.execute(sqlQuery, sqlParams);
            
            console.log("📊 Resultado de INSERT:", {
                affectedRows: result.affectedRows,
                insertId: result.insertId,
                warningCount: result.warningCount
            });

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                console.log("✅ INSERT exitoso, obteniendo usuario creado...");
                
                const [usuario] = await conexion.query(`SELECT * FROM usuarios WHERE idUsuario = LAST_INSERT_ID()`);
                console.log("👤 Usuario creado:", usuario);
                
                await conexion.execute("COMMIT");
                console.log("✅ Transacción completada exitosamente");
                
                return { success: true, message: "Usuario registrado correctamente.", usuario: usuario };
            } else {
                throw new Error("No fue posible registrar el usuario - No se afectaron filas");
            }
        } catch (error) {
            console.error("💥 Error en InsertarUsuarios:", error);
            
            try {
                await conexion.execute("ROLLBACK");
                console.log("🔄 Rollback ejecutado");
            } catch (rollbackError) {
                console.error("💥 Error en rollback:", rollbackError);
            }
            
            if (error instanceof z.ZodError) {
                console.log("📋 Error de validación Zod:", error.message);
                return { success: false, message: error.message }
            } else {
                console.log("📋 Error genérico:", error.message || error);
                return { success: false, message: `Error interno del servidor: ${error.message || error}` };
            }
        }
    }

    public async ActualizarUsuario(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown> }> {
        try {
            console.log("🔄 ActualizarUsuario - Iniciando actualización");
            console.log("📊 Datos recibidos:", this._objUsuario);
            console.log("🆔 ID Usuario:", this._idUsuario);

            if (!this._objUsuario) {
                throw new Error("No se ha proporcionado un objeto de usuario válido");
            }

            const { nombre, apellido, urlImagen, documento, contrasena } = this._objUsuario;
            if (!nombre || !apellido || !documento || !contrasena) {
                throw new Error("Faltan campos requeridos para actualizar el usuario");
            }

            console.log("💾 Iniciando transacción para actualización...");
            await conexion.execute("START TRANSACTION");

            const sqlQuery = `UPDATE usuarios SET nombre = ?, apellido = ?, urlImagen = ?, documento = ?, contrasena = ? WHERE idUsuario = ?`;
            const sqlParams = [nombre, apellido, urlImagen || '', documento, contrasena, this._idUsuario];
            
            console.log("📝 UPDATE Query:", sqlQuery);
            console.log("📋 UPDATE Params:", sqlParams);

            const result = await conexion.execute(sqlQuery, sqlParams);
            
            console.log("📊 Resultado de UPDATE:", {
                affectedRows: result.affectedRows,
                changedRows: result.changedRows,
                warningCount: result.warningCount
            });

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                console.log("✅ UPDATE exitoso, obteniendo usuario actualizado...");
                
                const [usuario] = await conexion.query(`SELECT * FROM usuarios WHERE idUsuario = ?`, [this._idUsuario]);
                console.log("👤 Usuario actualizado:", usuario);
                
                return { success: true, message: "Usuario actualizado correctamente", usuario: usuario };
            } else {
                throw new Error("No fue posible actualizar el usuario - No se afectaron filas");
            }
        } catch (error) {
            console.error("💥 Error en ActualizarUsuario:", error);
            
            try {
                await conexion.execute("ROLLBACK");
                console.log("🔄 Rollback ejecutado en actualización");
            } catch (rollbackError) {
                console.error("💥 Error en rollback de actualización:", rollbackError);
            }
            
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message }
            } else {
                return { success: false, message: `Error interno del servidor: ${error.message || error}` };
            }
        }
    }

    public async EliminarUsuario(): Promise<{ success: boolean; message: string }> {
        try {
            console.log("🗑️ EliminarUsuario - Iniciando eliminación");
            console.log("🆔 ID Usuario a eliminar:", this._idUsuario);

            if (!this._idUsuario) {
                throw new Error("No se ha proporcionado un id de usuario válido");
            }

            console.log("💾 Iniciando transacción para eliminación...");
            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`DELETE FROM usuarios WHERE idUsuario = ?`, [this._idUsuario]);
            
            console.log("📊 Resultado de DELETE:", {
                affectedRows: result.affectedRows,
                warningCount: result.warningCount
            });

            if (result && typeof result.affectedRows === "number" && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                console.log("✅ DELETE exitoso");
                return { success: true, message: "Usuario eliminado correctamente" };
            } else {
                throw new Error("No fue posible eliminar el usuario - Usuario no encontrado");
            }
        } catch (error) {
            console.error("💥 Error en EliminarUsuario:", error);
            
            try {
                await conexion.execute("ROLLBACK");
                console.log("🔄 Rollback ejecutado en eliminación");
            } catch (rollbackError) {
                console.error("💥 Error en rollback de eliminación:", rollbackError);
            }
            
            if (error instanceof z.ZodError) {
                return { success: false, message: error.message }
            } else {
                return { success: false, message: `Error interno del servidor: ${error.message || error}` };
            }
        }
    }
}