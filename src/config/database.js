// Esse arquivo cria uma "Pool" de conexões com o postgreSQL.
// Uma pool e mais eficiente que abrir/fechar conexao toda hora

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
}); 

// Testa a conexao assim que o servidor sobe 
pool.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar no banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao PostgreSQL com sucesso!');
    } 
});

module.exports = pool;
