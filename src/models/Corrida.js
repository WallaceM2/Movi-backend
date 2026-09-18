const pool = require('../config/database');

async function criar(dados) {
    const { 
        passageiro_id, origem, destino, 
        origem_lat, origem_lng, destino_lat, destino_lng, valor,
        ganho_motorista, ganho_app, forma_pagamento = 'dinheiro'
    } = dados;

    // 1. Verifica se o passageiro possui débito pendente superior a R$ 10,00
    const resPassageiro = await pool.query(
        'SELECT debito_pendente FROM passageiros WHERE id = $1', 
        [passageiro_id]
    );

    if (resPassageiro.rows.length > 0) {
        const debito = parseFloat(resPassageiro.rows[0].debito_pendente || 0);
        if (debito >= 10.00 && forma_pagamento === 'dinheiro') {
            throw new Error('BLOQUEIO_DEBITO: Passageiro com saldo devedor superior a R$ 10,00. Necessário pagamento via Pix ou Cartão.');
        }
    }

    const query = `
        INSERT INTO corridas (
            passageiro_id, origem, destino, 
            origem_lat, origem_lng, destino_lat, destino_lng, valor, status,
            ganho_motorista, ganho_app, forma_pagamento, status_pagamento
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'solicitada', $9, $10, $11, 'pendente')
        RETURNING *;
    `;
    
    const valores = [
        passageiro_id, origem, destino, 
        origem_lat, origem_lng, destino_lat, destino_lng, valor,
        ganho_motorista, ganho_app, forma_pagamento
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
    // Valida se o motorista está bloqueado para corridas em dinheiro se for o caso, 
    // mas por segurança permitimos aceitar e o controladora filtra o tipo se necessário.
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

// ----------------------------------------------------
// NOVAS FUNÇÕES FINANCEIRAS (ETAPA 3)
// ----------------------------------------------------

async function finalizarComPagamento(corrida_id, dadosPagamento) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { status_pagamento, valor_recebido_motorista, observacao_pagamento } = dadosPagamento;

        // 1. Busca dados da corrida
        const resCorrida = await client.query('SELECT * FROM corridas WHERE id = $1', [corrida_id]);
        const corrida = resCorrida.rows[0];

        if (!corrida) {
            throw new Error('Corrida não encontrada.');
        }

        const motorista_id = corrida.motorista_id;
        const passageiro_id = corrida.passageiro_id;
        const ganhoApp = parseFloat(corrida.ganho_app);
        const valorTotal = parseFloat(corrida.valor);

        // 2. Atualiza o status da corrida para concluída e pagamento correspondente
        await client.query(`
            UPDATE corridas 
            SET status = 'concluida', 
                status_pagamento = $1, 
                valor_recebido_motorista = $2, 
                observacao_pagamento = $3, 
                atualizado_em = NOW()
            WHERE id = $4
        `, [status_pagamento, valor_recebido_motorista, observacao_pagamento, corrida_id]);

        // 3. Gestão Financeira do Motorista (se foi dinheiro ou pix direto)
        // Se foi dinheiro, o motorista recebeu o total em espécie e fica devendo a taxa do app (ganho_app)
        if (corrida.forma_pagamento === 'dinheiro') {
            // Busca saldo atual do motorista
            const resMotorista = await client.query('SELECT saldo_carteira FROM motoristas WHERE id = $1', [motorista_id]);
            const saldoAnterior = parseFloat(resMotorista.rows[0].saldo_carteira || 0);
            
            // Abate a comissão do app do saldo da carteira (gerando saldo negativo se necessário)
            const saldoAtual = saldoAnterior - ganhoApp;

            // Atualiza saldo e verifica as travas de bloqueio (-5 e -15)
            const bloqueadoDinheiro = saldoAtual <= -5.00;

            await client.query(`
                UPDATE motoristas 
                SET saldo_carteira = $1, bloqueado_dinheiro = $2 
                WHERE id = $3
            `, [saldoAtual, bloqueadoDinheiro, motorista_id]);

            // Regista na tabela de transações
            await client.query(`
                INSERT INTO transacoes_motoristas (motorista_id, corrida_id, tipo, valor, saldo_anterior, saldo_atual)
                VALUES ($1, $2, 'debito_taxa_app', $3, $4, $5)
            `, [motorista_id, corrida_id, -ganhoApp, saldoAnterior, saldoAtual]);
        }

        // 4. Tratativa de Corrida Não Paga / Parcial (Golpe da próxima)
        if (status_pagamento === 'parcial' || status_pagamento === 'nao_pago') {
            const valorRecebido = parseFloat(valor_recebido_motorista || 0);
            const diferencaDebito = valorTotal - valorRecebido;

            if (diferencaDebito > 0) {
                // Adiciona o débito pendente na conta do passageiro
                const resPass = await client.query('SELECT debito_pendente FROM passageiros WHERE id = $1', [passageiro_id]);
                const debitoAtual = parseFloat(resPass.rows[0].debito_pendente || 0);
                const novoDebito = debitoAtual + diferencaDebito;

                await client.query(`
                    UPDATE passageiros SET debito_pendente = $1 WHERE id = $2
                `, [novoDebito, passageiro_id]);

                // Regista a ocorrência
                await client.query(`
                    INSERT INTO ocorrecias_pagamento (corrida_id, motorista_id, passageiro_id, valor_devido, valor_recebido, diferenca_debito)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [corrida_id, motorista_id, passageiro_id, valorTotal, valorRecebido, diferencaDebito]);
            }
        }

        await client.query('COMMIT');
        return { sucesso: true, mensagem: 'Corrida finalizada e acertos financeiros computados.' };

    } catch (erro) {
        await client.query('ROLLBACK');
        throw erro;
    } finally {
        client.release();
    }
}

module.exports = { 
    criar, 
    buscarPorId, 
    aceitar, 
    atualizarStatus, 
    finalizarComPagamento 
};