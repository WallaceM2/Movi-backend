const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Cadastra um novo motorista (versao inicial, sem senha/hash ainda)

async function criar(dados) {
    const {
        nome, sobrenome, email, telefone, senha, data_nascimento, nacionalidade,
        cpf, rg, cnh, regiao, estado, cidade, categoria
    } = dados;

        //gera o hash da senha antes de salvar ( nunca salvamos a senha original )

            const senha_hash = await bcrypt.hash(senha, 10);

    const query = `
            INSERT INTO motoristas
                (nome, sobrenome, email, senha_hash, telefone, data_nascimento, nacionalidade,
                cpf, rg, cnh, regiao, estado, cidade, categoria)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING id, nome, sobrenome, email, status_cadastro, criado_em;
    `; 

            const valores = [nome, sobrenome, email, senha_hash, telefone, data_nascimento, nacionalidade, cpf, rg, cnh, regiao, estado, cidade, categoria];
            const resultado = await pool.query(query, valores);
                return resultado.rows[0];
}

// Lista todos os motoristas cadastrados

async function listarTodos () {
    const query = `
                SELECT id, nome, sobrenome, email, categoria, status_cadastro, nota_media, criado_em
                 FROM motoristas
                ORDER BY criado_em DESC;
    `;
        const resultado = await pool.query(query);
        return resultado.rows;
}

// Busca um motorista pelo email, incluindo a senha ( so usado internamente no login )
    async function buscarPorEmail(email) {
        const query = `SELECT * FROM motoristas WHERE email = $1;`;
        const resultado = await pool.query(query, [email]);
            return resultado.rows[0]; // retorna UNDEFINED se nao encontrar no banco!
    }

module.exports = { criar, listarTodos, buscarPorEmail };