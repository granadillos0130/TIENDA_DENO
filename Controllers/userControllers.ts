// deno-lint-ignore-file
import { Usuario } from "../Models/userModels.ts";
import { multiParser } from "../Dependencies/dependencies.ts";
import { FileUploadHelper } from "../Utils/fileUpload.ts";

const USER_UPLOAD_PATH = "./uploads/users";
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const getUsers = async (ctx: any) => {
    const { response } = ctx;

    try {
        const objUsuario = new Usuario();
        const listaUsuarios = await objUsuario.SeleccionarUsuarios();
        response.status = 200;
        response.body = { success: true, data: listaUsuarios };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const postUsers = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const form = await multiParser(request.serverRequest);
        
        if (!form) {
            response.status = 400;
            response.body = { success: false, msg: "No se enviaron datos" };
            return;
        }

        // Extraer campos del formulario
        const nombre = form.fields.nombre;
        const apellido = form.fields.apellido;
        const documento = form.fields.documento;
        const contrasena = form.fields.contrasena;

        if (!nombre || !apellido || !documento || !contrasena) {
            response.status = 400;
            response.body = { success: false, msg: "Faltan campos requeridos: nombre, apellido, documento, contrasena" };
            return;
        }

        let urlImagen = '';

        // Manejar archivo de imagen si existe
        if (form.files && form.files.imagen) {
            const imageFile = Array.isArray(form.files.imagen) ? form.files.imagen[0] : form.files.imagen;
            
            // Validar archivo
            const validation = FileUploadHelper.validateFile(imageFile, {
                allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
                maxFileSize: MAX_FILE_SIZE,
                uploadPath: USER_UPLOAD_PATH
            });

            if (!validation.valid) {
                response.status = 400;
                response.body = { success: false, msg: validation.error };
                return;
            }

            // Generar nombre único y guardar archivo
            const fileName = FileUploadHelper.generateFileName(imageFile.filename || 'image.jpg');
            const filePath = await FileUploadHelper.saveFile(imageFile, USER_UPLOAD_PATH, fileName);
            urlImagen = filePath;
        }

        const UserData = {
            idUsuario: null,
            nombre: nombre,
            apellido: apellido,
            urlImagen: urlImagen,
            documento: documento,
            contrasena: contrasena
        };

        const objUser = new Usuario(UserData);
        const result = await objUser.InsertarUsuarios();
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const putUsers = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const form = await multiParser(request.serverRequest);
        
        if (!form || !form.fields.idUsuario) {
            response.status = 400;
            response.body = { success: false, msg: "ID de usuario requerido" };
            return;
        }

        const idUsuario = parseInt(form.fields.idUsuario);
        const nombre = form.fields.nombre;
        const apellido = form.fields.apellido;
        const documento = form.fields.documento;
        const contrasena = form.fields.contrasena;

        if (!nombre || !apellido || !documento || !contrasena) {
            response.status = 400;
            response.body = { success: false, msg: "Faltan campos requeridos" };
            return;
        }

        // Obtener usuario actual para manejar imagen existente
        const objUsuarioActual = new Usuario(null, idUsuario);
        const usuarioActual = await objUsuarioActual.SeleccionarUsuarioPorId();
        let urlImagen = usuarioActual?.urlImagen || '';

        // Manejar nueva imagen si se envía
        if (form.files && form.files.imagen) {
            const imageFile = Array.isArray(form.files.imagen) ? form.files.imagen[0] : form.files.imagen;
            
            const validation = FileUploadHelper.validateFile(imageFile, {
                allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
                maxFileSize: MAX_FILE_SIZE,
                uploadPath: USER_UPLOAD_PATH
            });

            if (!validation.valid) {
                response.status = 400;
                response.body = { success: false, msg: validation.error };
                return;
            }

            // Eliminar imagen anterior si existe
            if (usuarioActual?.urlImagen) {
                await FileUploadHelper.deleteFile(usuarioActual.urlImagen);
            }

            // Guardar nueva imagen
            const fileName = FileUploadHelper.generateFileName(imageFile.filename || 'image.jpg');
            const filePath = await FileUploadHelper.saveFile(imageFile, USER_UPLOAD_PATH, fileName);
            urlImagen = filePath;
        }

        const UserData = {
            idUsuario: idUsuario,
            nombre: nombre,
            apellido: apellido,
            urlImagen: urlImagen,
            documento: documento,
            contrasena: contrasena
        };

        const objUser = new Usuario(UserData, idUsuario);
        const result = await objUser.ActualizarUsuario();
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const deleteUsers = async (ctx: any) => {
    const { request, response } = ctx;
    
    try {
        const contentLength = request.headers.get("Content-Length");

        if (contentLength === "0") {
            response.status = 400;
            response.body = { success: false, msg: "El cuerpo de la solicitud no puede estar vacío" };
            return;
        }

        const body = await request.body.json();
        
        // Obtener usuario para eliminar su imagen
        const objUsuarioActual = new Usuario(null, body.idUsuario);
        const usuarioActual = await objUsuarioActual.SeleccionarUsuarioPorId();
        
        // Eliminar usuario
        const objUser = new Usuario(null, body.idUsuario);
        const result = await objUser.EliminarUsuario();
        
        // Si el usuario se eliminó correctamente, eliminar su imagen
        if (result.success && usuarioActual?.urlImagen) {
            await FileUploadHelper.deleteFile(usuarioActual.urlImagen);
        }
        
        response.status = 200;
        response.body = { success: true, body: result };
        
    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}