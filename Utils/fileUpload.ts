// deno-lint-ignore-file no-explicit-any

interface FileUploadOptions {
    allowedExtensions?: string[];
    maxFileSize?: number; // en bytes
    uploadPath: string;
}

export class FileUploadHelper {
    
    static async createUploadDirectory(path: string): Promise<void> {
        try {
            console.log("📁 Creando directorio:", path);
            await Deno.mkdir(path, { recursive: true });
            console.log("✅ Directorio creado/verificado:", path);
        } catch (error) {
            console.log("📁 Error creando directorio:", error);
            if (!(error instanceof Deno.errors.AlreadyExists)) {
                throw error;
            }
            console.log("ℹ️ Directorio ya existe:", path);
        }
    }

    static generateFileName(originalName: string): string {
        console.log("🏷️ Generando nombre para archivo:", originalName);
        
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const extension = originalName.split('.').pop();
        const newFileName = `${timestamp}_${random}.${extension}`;
        
        console.log("✅ Nombre generado:", newFileName);
        return newFileName;
    }

    static validateFile(file: any, options: FileUploadOptions): { valid: boolean; error?: string } {
        console.log("🔍 Iniciando validación de archivo");
        console.log("📋 Archivo recibido:", {
            filename: file.filename,
            size: file.content?.length || 'N/A',
            type: file.type || 'N/A'
        });
        console.log("📋 Opciones de validación:", options);

        // Validar que el archivo tenga contenido
        if (!file.content || file.content.length === 0) {
            console.log("❌ Archivo sin contenido");
            return {
                valid: false,
                error: "El archivo está vacío o no se pudo leer"
            };
        }

        // Validar extensión
        if (options.allowedExtensions) {
            const extension = file.filename?.split('.').pop()?.toLowerCase();
            console.log("🔍 Extensión detectada:", extension);
            console.log("🔍 Extensiones permitidas:", options.allowedExtensions);
            
            if (!extension || !options.allowedExtensions.includes(extension)) {
                console.log("❌ Extensión no válida");
                return {
                    valid: false,
                    error: `Extensión no permitida. Extensiones válidas: ${options.allowedExtensions.join(', ')}`
                };
            }
            console.log("✅ Extensión válida");
        }

        // Validar tamaño
        if (options.maxFileSize && file.content && file.content.length > options.maxFileSize) {
            console.log("❌ Archivo muy grande:", file.content.length, "bytes, máximo:", options.maxFileSize);
            return {
                valid: false,
                error: `Archivo muy grande. Tamaño máximo: ${options.maxFileSize / (1024 * 1024)}MB`
            };
        }

        console.log("✅ Archivo válido");
        return { valid: true };
    }

    static async saveFile(file: any, uploadPath: string, fileName: string): Promise<string> {
        console.log("💾 Iniciando guardado de archivo");
        console.log("📁 Ruta de destino:", uploadPath);
        console.log("📄 Nombre de archivo:", fileName);
        
        try {
            // Crear directorio si no existe
            await this.createUploadDirectory(uploadPath);
            
            const filePath = `${uploadPath}/${fileName}`;
            console.log("📍 Ruta completa del archivo:", filePath);
            
            if (file.content) {
                console.log("💾 Escribiendo archivo... Tamaño:", file.content.length, "bytes");
                await Deno.writeFile(filePath, file.content);
                console.log("✅ Archivo guardado exitosamente en:", filePath);
            } else {
                throw new Error("No hay contenido para guardar");
            }
            
            return filePath;
        } catch (error) {
            console.error("💥 Error guardando archivo:", error);
            throw error;
        }
    }

    static async deleteFile(filePath: string): Promise<void> {
        try {
            console.log("🗑️ Eliminando archivo:", filePath);
            await Deno.remove(filePath);
            console.log("✅ Archivo eliminado:", filePath);
        } catch (error) {
            console.error("💥 Error eliminando archivo:", error);
        }
    }
}