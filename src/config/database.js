const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString 
    ? {
        connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        family: 4 // FORÇA O USO DE IPv4 E EVITA O ERRO ENETUNREACH NO RENDER
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        family: 4
      };

const pool = new Pool(poolConfig);

// Testa a conexao assim que o servidor sobe 
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao conectar no banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao PostgreSQL com sucesso (IPv4 forçado)!');
        release();
    } 
});

module.exports = pool;