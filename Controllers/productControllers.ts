import { Producto } from "../Models/productModels.ts";
import { FileUploadHelper } from "../Utils/fileUpload.ts";

const PRODUCT_UPLOAD_PATH = "./uploads/products";
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const getProduct = async (ctx: any) => {
    const { response } = ctx;

    try {
        const objProducto = new Producto();
        const listaProductos = await objProducto.SeleccionarProductos();
        response.status = 200;
        response.body = { success: true, data: listaProductos };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const postProduct = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        console.log("🚀 POST /productos - Iniciando creación de producto");
        
        // Verificar Content-Type para determinar cómo procesar los datos
        const contentType = request.headers.get("Content-Type") || "";
        console.log("📋 Content-Type recibido:", contentType);

        let cantidad, descripcion, precio, unidad, idCategoria, urlImagen = '';

        if (contentType.includes("multipart/form-data")) {
            // Procesar como FormData usando Oak v17
            console.log("📁 Procesando como FormData (multipart) con Oak v17");
            
            try {
                const body = request.body;
                const form = await body.formData();
                
                console.log("📋 FormData procesado, obteniendo campos...");

                // Extraer campos del formulario
                cantidad = parseInt(form.get("cantidad")) || 0;
                descripcion = form.get("descripcion");
                precio = parseFloat(form.get("precio"));
                unidad = form.get("unidad");
                idCategoria = parseInt(form.get("idCategoria"));

                console.log("📝 Datos extraídos del FormData:", { 
                    cantidad, descripcion, precio, unidad, idCategoria 
                });

                // Validar campos requeridos
                if (!descripcion || !precio || !unidad || !idCategoria) {
                    console.log("❌ Faltan campos requeridos para producto");
                    response.status = 400;
                    response.body = { success: false, msg: "Faltan campos requeridos: descripcion, precio, unidad, idCategoria" };
                    return;
                }

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
                            uploadPath: PRODUCT_UPLOAD_PATH
                        });

                        if (!validation.valid) {
                            console.log("❌ Validación de imagen falló:", validation.error);
                            response.status = 400;
                            response.body = { success: false, msg: validation.error };
                            return;
                        }

                        // Generar nombre único y guardar archivo
                        const fileName = FileUploadHelper.generateFileName(imageFile.name || 'product.jpg');
                        const filePath = await FileUploadHelper.saveFile(fileObject, PRODUCT_UPLOAD_PATH, fileName);
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
            
            cantidad = data.cantidad || 0;
            descripcion = data.descripcion;
            precio = data.precio;
            unidad = data.unidad;
            idCategoria = data.idCategoria;
            urlImagen = data.urlImagen || '';
            
            console.log("📝 Datos extraídos del JSON:", { 
                cantidad, descripcion, precio, unidad, idCategoria, urlImagen 
            });

            // Validar campos requeridos
            if (!descripcion || !precio || !unidad || !idCategoria) {
                console.log("❌ Faltan campos requeridos para producto");
                response.status = 400;
                response.body = { success: false, msg: "Faltan campos requeridos: descripcion, precio, unidad, idCategoria" };
                return;
            }
            
        } else {
            console.log("❌ Content-Type no soportado:", contentType);
            response.status = 400;
            response.body = { success: false, msg: "Content-Type no soportado. Use multipart/form-data o application/json" };
            return;
        }

        const ProductData = {
            idProducto: null,
            cantidad: cantidad,
            descripcion: descripcion.trim(),
            precio: precio,
            unidad: unidad.trim(),
            urlImagen: urlImagen,
            idCategoria: idCategoria
        };

        console.log("💾 Creando producto con datos:", ProductData);

        const objProduct = new Producto(ProductData);
        const result = await objProduct.InsertarProducto();
        
        console.log("✅ Producto creado exitosamente:", result);
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        console.error("💥 Error en postProduct:", error);
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error.message || error };
    }
}

export const putProduct = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        console.log("🔄 PUT /productos - Iniciando actualización de producto");
        
        const contentType = request.headers.get("Content-Type") || "";
        console.log("📋 Content-Type recibido:", contentType);

        let idProducto, cantidad, descripcion, precio, unidad, idCategoria;
        let urlImagen = '';

        if (contentType.includes("multipart/form-data")) {
            // Procesar como FormData
            console.log("📁 Procesando actualización como FormData");
            
            const body = request.body;
            const form = await body.formData();
            
            idProducto = parseInt(form.get("idProducto"));
            cantidad = parseInt(form.get("cantidad")) || 0;
            descripcion = form.get("descripcion");
            precio = parseFloat(form.get("precio"));
            unidad = form.get("unidad");
            idCategoria = parseInt(form.get("idCategoria"));

            if (!idProducto) {
                response.status = 400;
                response.body = { success: false, msg: "ID de producto requerido" };
                return;
            }

            if (!descripcion || !precio || !unidad || !idCategoria) {
                response.status = 400;
                response.body = { success: false, msg: "Faltan campos requeridos" };
                return;
            }

            // Obtener producto actual para manejar imagen existente
            const objProductoActual = new Producto(null, idProducto);
            const productoActual = await objProductoActual.SeleccionarProductoPorId();
            urlImagen = productoActual?.urlImagen || '';

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
                    uploadPath: PRODUCT_UPLOAD_PATH
                });

                if (!validation.valid) {
                    response.status = 400;
                    response.body = { success: false, msg: validation.error };
                    return;
                }

                // Eliminar imagen anterior si existe
                if (productoActual?.urlImagen) {
                    await FileUploadHelper.deleteFile(productoActual.urlImagen);
                }

                // Guardar nueva imagen
                const fileName = FileUploadHelper.generateFileName(imageFile.name || 'product.jpg');
                const filePath = await FileUploadHelper.saveFile(fileObject, PRODUCT_UPLOAD_PATH, fileName);
                urlImagen = filePath;
            }

        } else if (contentType.includes("application/json")) {
            // Procesar como JSON
            const body = request.body;
            const data = await body.json();
            
            idProducto = data.idProducto;
            cantidad = data.cantidad || 0;
            descripcion = data.descripcion;
            precio = data.precio;
            unidad = data.unidad;
            idCategoria = data.idCategoria;
            
            if (!idProducto) {
                response.status = 400;
                response.body = { success: false, msg: "ID de producto requerido" };
                return;
            }

            if (!descripcion || !precio || !unidad || !idCategoria) {
                response.status = 400;
                response.body = { success: false, msg: "Faltan campos requeridos" };
                return;
            }
            
            // Mantener imagen existente si no se envía nueva
            const objProductoActual = new Producto(null, idProducto);
            const productoActual = await objProductoActual.SeleccionarProductoPorId();
            urlImagen = data.urlImagen || productoActual?.urlImagen || '';
            
        } else {
            response.status = 400;
            response.body = { success: false, msg: "Content-Type no soportado" };
            return;
        }

        const ProductData = {
            idProducto: idProducto,
            cantidad: cantidad,
            descripcion: descripcion.trim(),
            precio: precio,
            unidad: unidad.trim(),
            urlImagen: urlImagen,
            idCategoria: idCategoria
        };

        const objProduct = new Producto(ProductData, idProducto);
        const result = await objProduct.ActualizarProducto();
        
        console.log("✅ Producto actualizado exitosamente");
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        console.error("💥 Error en putProduct:", error);
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error.message || error };
    }
}

export const deleteProduct = async (ctx: any) => {
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
        
        // Obtener producto para eliminar su imagen
        const objProductoActual = new Producto(null, data.idProducto);
        const productoActual = await objProductoActual.SeleccionarProductoPorId();
        
        // Eliminar producto
        const objProduct = new Producto(null, data.idProducto);
        const result = await objProduct.EliminarProducto();
        
        // Si el producto se eliminó correctamente, eliminar su imagen
        if (result.success && productoActual?.urlImagen) {
            await FileUploadHelper.deleteFile(productoActual.urlImagen);
        }
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        console.error("💥 Error en deleteProduct:", error);
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error.message || error };
    }
}