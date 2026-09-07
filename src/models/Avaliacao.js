const pool = require('../config/database');

async function criar(dados) {
    const { avaliado_tipo, avaliado_id, avaliador_tipo, avaliador_id, nota, tag, comentario} = dados;

        const query = `
         INSERT INTO avaliacoes
        (avaliado_tipo, avaliado_id, avaliador_tipo, avaliador_id, nota, tag, comentario)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;

    const valores = [avaliado_tipo, avaliado_id, avaliador_tipo, avaliador_id, nota, tag, comentario];
        const resultado = await pool.query(query, valores);
            return resultado.rows[0];
}

// Lista todas as avaliações recebidas por um usuário específico
async function listarPorAvaliado(avaliado_tipo, avaliado_id) {
    const query =    `
            SELECT * FROM avaliacoes
            WHERE avaliado_tipo = $1 AND avaliado_id = $2
            ORDER BY criado_em DESC;
        `;
            const resultado = await pool.query(query, [avaliado_tipo, avaliado_id] );
                return resultado.rows;
}

// Atualiza a média do avaliado usando a fórmula de média incremental
async function atualizarMedia(avaliado_tipo, avaliado_id, notaNova) {
    const tabela = avaliado_tipo === 'motorista' ? 'motoristas' : 'passageiros';

        const query = `
             UPDATE ${tabela}
                SET
                nota_media = ROUND(
                ((nota_media * total_avaliacoes) + $1) / (total_avaliacoes + 1),
                1
                ),
                total_avaliacoes = total_avaliacoes + 1
                WHERE id = $2
                RETURNING id, nome, nota_media, total_avaliacoes;
            `;
            
    const resultado = await pool.query(query, [notaNova, avaliado_id]);
        return resultado.rows[0];
}

module.exports = { criar, listarPorAvaliado, atualizarMedia };