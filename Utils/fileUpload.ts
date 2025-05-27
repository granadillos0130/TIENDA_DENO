import { multiParser } from "../Dependencies/dependencies.ts";

interface FileUploadOptions {
    allowedExtensions?: string[];
    maxFileSize?: number; // en bytes
    uploadPath: string;
}

export class FileUploadHelper {
    
    static async createUploadDirectory(path: string): Promise<void> {
        try {
            await Deno.mkdir(path, { recursive: true });
        } catch (error) {
            if (!(error instanceof Deno.errors.AlreadyExists)) {
                throw error;
            }
        }
    }

    static generateFileName(originalName: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const extension = originalName.split('.').pop();
        return `${timestamp}_${random}.${extension}`;
    }

    static validateFile(file: any, options: FileUploadOptions): { valid: boolean; error?: string } {
        // Validar extensión
        if (options.allowedExtensions) {
            const extension = file.filename?.split('.').pop()?.toLowerCase();
            if (!extension || !options.allowedExtensions.includes(extension)) {
                return {
                    valid: false,
                    error: `Extensión no permitida. Extensiones válidas: ${options.allowedExtensions.join(', ')}`
                };
            }
        }

        // Validar tamaño
        if (options.maxFileSize && file.content && file.content.length > options.maxFileSize) {
            return {
                valid: false,
                error: `Archivo muy grande. Tamaño máximo: ${options.maxFileSize / (1024 * 1024)}MB`
            };
        }

        return { valid: true };
    }

    static async saveFile(file: any, uploadPath: string, fileName: string): Promise<string> {
        await this.createUploadDirectory(uploadPath);
        const filePath = `${uploadPath}/${fileName}`;
        
        if (file.content) {
            await Deno.writeFile(filePath, file.content);
        }
        
        return filePath;
    }

    static async deleteFile(filePath: string): Promise<void> {
        try {
            await Deno.remove(filePath);
        } catch (error) {
            console.error(`Error eliminando archivo: ${error}`);
        }
    }
}