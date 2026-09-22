import { BeforeAll } from '@cucumber/cucumber';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

BeforeAll(async function () {
    const client = new Client({
        connectionString: 'postgresql://ovaltrack:ovaltrack@db:5432/ovaltrack'
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, 'clean.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('Base de datos limpiada correctamente antes de ejecutar los tests.');
    } catch (err) {
        console.error('Error al limpiar la base de datos:', err);
        throw err;
    } finally {
        await client.end();
    }
});
