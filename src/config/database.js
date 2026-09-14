// Esse arquivo cria uma "Pool" de conexões com o postgreSQL.
// Uma pool e mais eficiente que abrir/fechar conexao toda hora

const { Pool } = require('pg');
require('dotenv').config();

// Se houver DATABASE_URL (usado no Render/Produção), usa ela. 
// Caso contrário, usa as variáveis separadas do ambiente local.
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString 
    ? {
        connectionString,
        ssl: {
            rejectUnauthorized: false // Obrigatório para conexões com o Supabase na nuvem
        }
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
      };

const pool = new Pool(poolConfig);

// Testa a conexao assim que o servidor sobe 
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao conectar no banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao PostgreSQL com sucesso!');
        release();
    } 
});

module.exports = pool;