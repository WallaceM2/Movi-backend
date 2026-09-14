const pool = require('../config/database');

async function consultarExtrato(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const tipo_usuario = req.usuario.tipo; 

        const colunaId = tipo_usuario === 'motorista' ? 'motorista_id' : 'passageiro_id';

        // Trazemos as novas colunas do banco
        const query = `
            SELECT id, origem, destino, valor, ganho_motorista, ganho_app, status, criado_em 
            FROM corridas 
            WHERE ${colunaId} = $1 
            ORDER BY criado_em DESC;
        `;
        
        const resultado = await pool.query(query, [usuario_id]);
        const corridas = resultado.rows;

        // Soma APENAS a fatia do motorista
        let ganhosTotais = 0;
        if (tipo_usuario === 'motorista') {
            ganhosTotais = corridas
                .filter(c => c.status === 'concluida')
                .reduce((acc, atual) => acc + Number(atual.ganho_motorista || 0), 0);
        }

        res.json({
            saldo_total: ganhosTotais > 0 ? ganhosTotais.toFixed(2) : undefined,
            total_viagens: corridas.length,
            historico: corridas
        });
    } catch (erro) {
        console.error('Erro ao buscar histórico:', erro);
        res.status(500).json({ erro: 'Não foi possível carregar o extrato.' });
    }
}

module.exports = { consultarExtrato };