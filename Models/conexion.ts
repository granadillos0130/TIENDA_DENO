import { Client } from "../Dependencies/dependencies.ts";

export const conexion = await new Client().connect({
    hostname: "localhost",
    username: "root",
    db: "adso_tienda",
    password:"",
});