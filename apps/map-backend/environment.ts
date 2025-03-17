import * as dotenv from 'dotenv';
dotenv.config();

export const environment = {
    production: process.env.NODE_ENV === 'production',
    port: process.env.PORT || 3333,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
    dbPath: process.env.DB_PATH || './data/geodata.db'
};
