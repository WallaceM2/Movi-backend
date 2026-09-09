const pool = require('../config/database');

async function criar(dados) {
    const { 
        passageiro_id, origem, destino, 
        origem_lat, origem_lng, destino_lat, destino_lng, valor 
    } = dados;

    const query = `
        INSERT INTO corridas (
            passageiro_id, origem, destino, 
            origem_lat, origem_lng, destino_lat, destino_lng, valor, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'solicitada')
        RETURNING *;
    `;
    
    const valores = [
        passageiro_id, origem, destino, 
        origem_lat, origem_lng, destino_lat, destino_lng, valor
    ];

    const { rows } = await pool.query(query, valores);
    return rows[0];
}

async function buscarPorId(id) {
    const query = `SELECT * FROM corridas WHERE id = $1;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
}

async function aceitar(corrida_id, motorista_id) {
    const query = `
        UPDATE corridas 
        SET motorista_id = $1, status = 'aceita', atualizado_em = NOW()
        WHERE id = $2 AND status = 'solicitada'
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [motorista_id, corrida_id]);
    return rows[0];
}

async function atualizarStatus(id, status) {
    const query = `
        UPDATE corridas 
        SET status = $1, atualizado_em = NOW()
        WHERE id = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, id]);
    return rows[0];
}

module.exports = { criar, buscarPorId, aceitar, atualizarStatus };