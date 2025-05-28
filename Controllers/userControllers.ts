// deno-lint-ignore-file
import { Usuario } from "../Models/userModels.ts";
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
        console.log("🚀 POST /usuarios - Iniciando creación de usuario");
        
        // Verificar Content-Type para determinar cómo procesar los datos
        const contentType = request.headers.get("Content-Type") || "";
        console.log("📋 Content-Type recibido:", contentType);

        let nombre, apellido, documento, contrasena, urlImagen = '';

        if (contentType.includes("multipart/form-data")) {
            // Procesar como FormData usando Oak's body parser
            console.log("📁 Procesando como FormData (multipart) con Oak v17");
            
            try {
                const body = request.body;
                const form = await body.formData();
                
                console.log("📋 FormData procesado, obteniendo campos...");

                // Extraer campos del formulario
                nombre = form.get("nombre");
                apellido = form.get("apellido");
                documento = form.get("documento");
                contrasena = form.get("contrasena");

                console.log("📝 Datos extraídos del FormData:", { nombre, apellido, documento, contrasena: "***" });

                // Manejar archivo de imagen si existe
                const imageFile = form.get("imagen");
                if (imageFile && typeof imageFile === "object" && imageFile.constructor.name === "File") {
                    console.log("🖼️ Imagen detectada en FormData");
                    console.log("📄 Archivo detectado:", {
                        name: imageFile.name,
                        size: imageFile.size,
                        type: imageFile.type
                    });
                    
                    try {
                        // Convertir File a Uint8Array
                        const fileBuffer = await imageFile.arrayBuffer();
                        const fileContent = new Uint8Array(fileBuffer);
                        
                        // Crear objeto compatible con FileUploadHelper
                        const fileObject = {
                            filename: imageFile.name,
                            content: fileContent,
                            type: imageFile.type
                        };
                        
                        // Validar archivo
                        const validation = FileUploadHelper.validateFile(fileObject, {
                            allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
                            maxFileSize: MAX_FILE_SIZE,
                            uploadPath: USER_UPLOAD_PATH
                        });

                        if (!validation.valid) {
                            console.log("❌ Validación de imagen falló:", validation.error);
                            response.status = 400;
                            response.body = { success: false, msg: validation.error };
                            return;
                        }

                        // Generar nombre único y guardar archivo
                        const fileName = FileUploadHelper.generateFileName(imageFile.name || 'image.jpg');
                        const filePath = await FileUploadHelper.saveFile(fileObject, USER_UPLOAD_PATH, fileName);
                        urlImagen = filePath;
                        
                        console.log("✅ Imagen guardada en:", filePath);
                    } catch (imageError) {
                        console.error("💥 Error procesando imagen:", imageError);
                        response.status = 400;
                        response.body = { success: false, msg: `Error procesando imagen: ${imageError.message}` };
                        return;
                    }
                } else {
                    console.log("ℹ️ No se envió imagen en FormData");
                }

            } catch (formError) {
                console.error("💥 Error procesando FormData:", formError);
                response.status = 400;
                response.body = { success: false, msg: `Error procesando FormData: ${formError.message}` };
                return;
            }

        } else if (contentType.includes("application/json")) {
            // Procesar como JSON (sin imagen)
            console.log("📄 Procesando como JSON (sin imagen)");
            
            const body = request.body;
            const data = await body.json();
            
            nombre = data.nombre;
            apellido = data.apellido;
            documento = data.documento;
            contrasena = data.contrasena;
            
            console.log("📝 Datos extraídos del JSON:", { nombre, apellido, documento, contrasena: "***" });
            
        } else {
            console.log("❌ Content-Type no soportado:", contentType);
            response.status = 400;
            response.body = { success: false, msg: "Content-Type no soportado. Use multipart/form-data o application/json" };
            return;
        }

        // Validar campos requeridos
        if (!nombre || !apellido || !documento || !contrasena) {
            console.log("❌ Faltan campos requeridos");
            response.status = 400;
            response.body = { success: false, msg: "Faltan campos requeridos: nombre, apellido, documento, contrasena" };
            return;
        }

        const UserData = {
            idUsuario: null,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            urlImagen: urlImagen,
            documento: documento.trim(),
            contrasena: contrasena.trim()
        };

        console.log("💾 Creando usuario con datos:", { ...UserData, contrasena: "***" });

        const objUser = new Usuario(UserData);
        const result = await objUser.InsertarUsuarios();
        
        console.log("✅ Usuario creado exitosamente:", result);
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        console.error("💥 Error en postUsers:", error);
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error.message || error };
    }
}

export const putUsers = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        console.log("🔄 PUT /usuarios - Iniciando actualización de usuario");
        
        const contentType = request.headers.get("Content-Type") || "";
        console.log("📋 Content-Type recibido:", contentType);

        let idUsuario, nombre, apellido, documento, contrasena;
        let urlImagen = '';

        if (contentType.includes("multipart/form-data")) {
            // Procesar como FormData
            console.log("📁 Procesando actualización como FormData");
            
            const body = request.body;
            const form = await body.formData();
            
            idUsuario = parseInt(form.get("idUsuario"));
            nombre = form.get("nombre");
            apellido = form.get("apellido");
            documento = form.get("documento");
            contrasena = form.get("contrasena");

            if (!idUsuario) {
                response.status = 400;
                response.body = { success: false, msg: "ID de usuario requerido" };
                return;
            }

            // Obtener usuario actual para manejar imagen existente
            const objUsuarioActual = new Usuario(null, idUsuario);
            const usuarioActual = await objUsuarioActual.SeleccionarUsuarioPorId();
            urlImagen = usuarioActual?.urlImagen || '';

            // Manejar nueva imagen si se envía
            const imageFile = form.get("imagen");
            if (imageFile && typeof imageFile === "object" && imageFile.constructor.name === "File") {
                console.log("🖼️ Nueva imagen detectada para actualización");
                
                const fileBuffer = await imageFile.arrayBuffer();
                const fileContent = new Uint8Array(fileBuffer);
                
                const fileObject = {
                    filename: imageFile.name,
                    content: fileContent,
                    type: imageFile.type
                };
                
                const validation = FileUploadHelper.validateFile(fileObject, {
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
                const fileName = FileUploadHelper.generateFileName(imageFile.name || 'image.jpg');
                const filePath = await FileUploadHelper.saveFile(fileObject, USER_UPLOAD_PATH, fileName);
                urlImagen = filePath;
            }

        } else if (contentType.includes("application/json")) {
            // Procesar como JSON
            const body = request.body;
            const data = await body.json();
            
            idUsuario = data.idUsuario;
            nombre = data.nombre;
            apellido = data.apellido;
            documento = data.documento;
            contrasena = data.contrasena;
            
            // Mantener imagen existente si no se envía nueva
            if (idUsuario) {
                const objUsuarioActual = new Usuario(null, idUsuario);
                const usuarioActual = await objUsuarioActual.SeleccionarUsuarioPorId();
                urlImagen = usuarioActual?.urlImagen || '';
            }
            
        } else {
            response.status = 400;
            response.body = { success: false, msg: "Content-Type no soportado" };
            return;
        }

        if (!nombre || !apellido || !documento || !contrasena || !idUsuario) {
            response.status = 400;
            response.body = { success: false, msg: "Faltan campos requeridos" };
            return;
        }

        const UserData = {
            idUsuario: idUsuario,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            urlImagen: urlImagen,
            documento: documento.trim(),
            contrasena: contrasena.trim()
        };

        const objUser = new Usuario(UserData, idUsuario);
        const result = await objUser.ActualizarUsuario();
        
        console.log("✅ Usuario actualizado exitosamente");
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        console.error("💥 Error en putUsers:", error);
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error.message || error };
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

        const body = request.body;
        const data = await body.json();
        
        // Obtener usuario para eliminar su imagen
        const objUsuarioActual = new Usuario(null, data.idUsuario);
        const usuarioActual = await objUsuarioActual.SeleccionarUsuarioPorId();
        
        // Eliminar usuario
        const objUser = new Usuario(null, data.idUsuario);
        const result = await objUser.EliminarUsuario();
        
        // Si el usuario se eliminó correctamente, eliminar su imagen
        if (result.success && usuarioActual?.urlImagen) {
            await FileUploadHelper.deleteFile(usuarioActual.urlImagen);
        }
        
        response.status = 200;
        response.body = { success: true, body: result };
        
    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error.message || error };
    }
}