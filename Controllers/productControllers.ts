import { Producto } from "../Models/productModels.ts";
import { multiParser } from "../Dependencies/dependencies.ts";
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
        const form = await multiParser(request.serverRequest);
        
        if (!form) {
            response.status = 400;
            response.body = { success: false, msg: "No se enviaron datos" };
            return;
        }

        // Extraer campos del formulario
        const cantidad = parseInt(form.fields.cantidad) || 0;
        const descripcion = form.fields.descripcion;
        const precio = parseFloat(form.fields.precio);
        const unidad = form.fields.unidad;
        const idCategoria = parseInt(form.fields.idCategoria);

        if (!descripcion || !precio || !unidad || !idCategoria) {
            response.status = 400;
            response.body = { success: false, msg: "Faltan campos requeridos: descripcion, precio, unidad, idCategoria" };
            return;
        }

        let urlImagen = '';

        // Manejar archivo de imagen si existe
        if (form.files && form.files.imagen) {
            const imageFile = Array.isArray(form.files.imagen) ? form.files.imagen[0] : form.files.imagen;
            
            const validation = FileUploadHelper.validateFile(imageFile, {
                allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
                maxFileSize: MAX_FILE_SIZE,
                uploadPath: PRODUCT_UPLOAD_PATH
            });

            if (!validation.valid) {
                response.status = 400;
                response.body = { success: false, msg: validation.error };
                return;
            }

            const fileName = FileUploadHelper.generateFileName(imageFile.filename || 'product.jpg');
            const filePath = await FileUploadHelper.saveFile(imageFile, PRODUCT_UPLOAD_PATH, fileName);
            urlImagen = filePath;
        }

        const ProductData = {
            idProducto: null,
            cantidad: cantidad,
            descripcion: descripcion,
            precio: precio,
            unidad: unidad,
            urlImagen: urlImagen,
            idCategoria: idCategoria
        };

        const objProduct = new Producto(ProductData);
        const result = await objProduct.InsertarProducto();
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}

export const putProduct = async (ctx: any) => {
    const { request, response } = ctx;

    try {
        const form = await multiParser(request.serverRequest);
        
        if (!form || !form.fields.idProducto) {
            response.status = 400;
            response.body = { success: false, msg: "ID de producto requerido" };
            return;
        }

        const idProducto = parseInt(form.fields.idProducto);
        const cantidad = parseInt(form.fields.cantidad) || 0;
        const descripcion = form.fields.descripcion;
        const precio = parseFloat(form.fields.precio);
        const unidad = form.fields.unidad;
        const idCategoria = parseInt(form.fields.idCategoria);

        if (!descripcion || !precio || !unidad || !idCategoria) {
            response.status = 400;
            response.body = { success: false, msg: "Faltan campos requeridos" };
            return;
        }

        // Obtener producto actual para manejar imagen existente
        const objProductoActual = new Producto(null, idProducto);
        const productoActual = await objProductoActual.SeleccionarProductoPorId();
        let urlImagen = productoActual?.urlImagen || '';

        // Manejar nueva imagen si se envía
        if (form.files && form.files.imagen) {
            const imageFile = Array.isArray(form.files.imagen) ? form.files.imagen[0] : form.files.imagen;
            
            const validation = FileUploadHelper.validateFile(imageFile, {
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
            const fileName = FileUploadHelper.generateFileName(imageFile.filename || 'product.jpg');
            const filePath = await FileUploadHelper.saveFile(imageFile, PRODUCT_UPLOAD_PATH, fileName);
            urlImagen = filePath;
        }

        const ProductData = {
            idProducto: idProducto,
            cantidad: cantidad,
            descripcion: descripcion,
            precio: precio,
            unidad: unidad,
            urlImagen: urlImagen,
            idCategoria: idCategoria
        };

        const objProduct = new Producto(ProductData, idProducto);
        const result = await objProduct.ActualizarProducto();
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
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

        const body = await request.body.json();
        
        // Obtener producto para eliminar su imagen
        const objProductoActual = new Producto(null, body.idProducto);
        const productoActual = await objProductoActual.SeleccionarProductoPorId();
        
        // Eliminar producto
        const objProduct = new Producto(null, body.idProducto);
        const result = await objProduct.EliminarProducto();
        
        // Si el producto se eliminó correctamente, eliminar su imagen
        if (result.success && productoActual?.urlImagen) {
            await FileUploadHelper.deleteFile(productoActual.urlImagen);
        }
        
        response.status = 200;
        response.body = { success: true, body: result };

    } catch (error) {
        response.status = 400;
        response.body = { success: false, msg: "Error al procesar la solicitud", errors: error };
    }
}