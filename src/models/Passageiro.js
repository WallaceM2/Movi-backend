const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function criar(dados) {
    const {
        nome, sobrenome, email, telefone, senha, data_nascimento,
        nacionalidade, cpf, rg, cnh, regiao, estado, cidade
    } = dados;

    const senha_hash = await bcrypt.hash(senha, 10);

    const query = `
        INSERT INTO passageiros
            (nome, sobrenome, email, telefone, senha_hash, data_nascimento,
            nacionalidade, cpf, rg, cnh, regiao, estado, cidade)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, nome, sobrenome, email, status_conta, criado_em;
    `;

    const valores = [nome, sobrenome, email, telefone, senha_hash, data_nascimento,
        nacionalidade, cpf, rg, cnh, regiao, estado, cidade];

    const resultado = await pool.query(query, valores);
    return resultado.rows[0];    
}

async function listarTodos() {
    const query = `
        SELECT id, nome, sobrenome, email, status_conta, nota_media, criado_em
        FROM passageiros
        ORDER BY criado_em DESC;
    `;
    const resultado = await pool.query(query);
    return resultado.rows;
}

async function buscarPorEmail(email) {
    const query = `SELECT * FROM passageiros WHERE email = $1;`;
    const resultado = await pool.query(query, [email]);
    return resultado.rows[0];
}

// Busca um passageiro específico pelo id
async function buscarPorId(id) {
    const query = `
    SELECT id, nome, sobrenome, email, cpf, rg, cnh,
           status_conta, conta_verificada, foto_perfil_url,
           nota_media, total_avaliacoes, criado_em
    FROM passageiros
    WHERE id = $1;
  `;
    const resultado = await pool.query(query, [id]);
    return resultado.rows[0];
}

// Atualiza o status da conta do passageiro

async function atualizarStatus(id, novoStatus) {
    const query = `
    UPDATE passageiros
    SET status_conta = $1, atualizado_em = NOW()
    WHERE id = $2
    RETURNING id, nome, sobrenome, email, status_conta;
  `;
    const resultado = await pool.query(query, [novoStatus, id]);
    return resultado.rows[0];
}

// Atualiza os documentos do passageiro
async function atualizarDocumentos(id, campos) {
    const colunas = Object.keys(campos);
        if (colunas.length === 0) return null;
    
    const sets = colunas.map((coluna, i) => `${coluna} = $${i + 1}`).join(', ');
    const valores = Object.values(campos);    
    
    const query = `
            UPDATE passageiros
            SET ${sets}, atualizado_em = NOW()
            WHERE id = $${colunas.length + 1}
            RETURNING id, nome, rg_foto_url, cnh_foto_url, foto_perfil_url;
        `;

    const resultado = await pool.query(query, [...valores, id]);
    return resultado.rows[0];
        
}

module.exports = { criar, listarTodos, buscarPorEmail, buscarPorId, atualizarStatus, atualizarDocumentos };