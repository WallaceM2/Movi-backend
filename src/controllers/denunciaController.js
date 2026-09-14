const pool = require('../config/database');

async function criarDenuncia(req, res) {
    try {
        const denunciante_id = req.usuario.id;
        const denunciante_tipo = req.usuario.tipo; 
        
        const { corrida_id, denunciado_id, motivo, descricao } = req.body;

        if (!corrida_id || !denunciado_id || !motivo) {
            return res.status(400).json({ erro: 'Corrida, usuário denunciado e motivo são obrigatórios.' });
        }

        // 1. Grava a denúncia na tabela
        const queryDenuncia = `
            INSERT INTO denuncias (corrida_id, denunciante_tipo, denunciante_id, denunciado_id, motivo, descricao)
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;
        const valores = [corrida_id, denunciante_tipo, denunciante_id, denunciado_id, motivo, descricao];
        const resultado = await pool.query(queryDenuncia, valores);
        const novaDenuncia = resultado.rows[0];

        // ==========================================
        // 2. CÉREBRO DE SEGURANÇA: PENALIDADE AUTOMÁTICA
        // ==========================================
        const motivosGraves = ['direcao_perigosa', 'assedio', 'agressao', 'roubo'];
        let penalidadeAplicada = false;

        if (motivosGraves.includes(motivo)) {
            // Descobre se o alvo é motorista ou passageiro
            const tipoAlvo = denunciante_tipo === 'passageiro' ? 'motorista' : 'passageiro';
            const tabelaAlvo = tipoAlvo === 'motorista' ? 'motoristas' : 'passageiros';
            const colunaStatus = tipoAlvo === 'motorista' ? 'status_cadastro' : 'status';

            // Bloqueia a conta do acusado imediatamente
            await pool.query(
                `UPDATE ${tabelaAlvo} SET ${colunaStatus} = 'suspenso' WHERE id = $1`, 
                [denunciado_id]
            );
            penalidadeAplicada = true;
        }

        // 3. Resposta dinâmica baseada na gravidade
        if (penalidadeAplicada) {
            return res.status(201).json({
                mensagem: 'ALERTA: Denúncia grave registrada. A conta do acusado foi SUSPENSA preventivamente por segurança.',
                denuncia: novaDenuncia,
                bloqueio_automatico: true
            });
        }

        res.status(201).json({
            mensagem: 'Denúncia registrada com sucesso. A equipe fará a análise em breve.',
            denuncia: novaDenuncia,
            bloqueio_automatico: false
        });

    } catch (erro) {
        console.error('Erro ao registrar denúncia:', erro);
        res.status(500).json({ erro: 'Falha ao registrar a denúncia.' });
    }
}

module.exports = { criarDenuncia };