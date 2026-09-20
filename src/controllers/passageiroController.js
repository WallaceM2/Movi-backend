const Passageiro = require('../models/Passageiro');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function cadastrar(req, res) {
    try {
        const { nome, sobrenome, email, senha, cpf } = req.body;
        
        if (!nome || !sobrenome || !email || !senha || !cpf) {
            return res.status(400).json({
                erro: 'Campos obrigatórios: nome, sobrenome, email, senha, cpf'
            });
        }
        const novoPassageiro = await Passageiro.criar(req.body);
        res.status(201).json({
            mensagem: 'Passageiro cadastrado com sucesso!',
            passageiro: novoPassageiro
        });
    } catch (erro) {
        if (erro.code === '23505') {
            return res.status(409).json({ erro: 'CPF ou email já cadastrado.' });
        }
        
        console.error('ERRO DETALHADO:', erro);

        // Força a extração de qualquer propriedade de erro para o Postman exibir
        const mensagemErro = erro.message || erro.toString();
        const detalhesExtras = JSON.stringify(erro, Object.getOwnPropertyNames(erro));

        res.status(500).json({ 
            erro: 'Erro interno ao cadastrar passageiro.',
            detalhe_tecnico: mensagemErro,
            json_completo: detalhesExtras
        });
    }
}

async function listar(req, res) {
    try {
        const passageiros = await Passageiro.listarTodos();
        res.json(passageiros);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao buscar passageiros.' });
    }
}

async function login(req, res) {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
        }

        const passageiro = await Passageiro.buscarPorEmail(email);

        if (!passageiro) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const senhaCorreta = await bcrypt.compare(senha, passageiro.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { id: passageiro.id, tipo: 'passageiro' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            mensagem: 'Login realizado com sucesso!',
            token,
            passageiro: {
                id: passageiro.id,
                nome: passageiro.nome,
                sobrenome: passageiro.sobrenome,
                email: passageiro.email,
                status_conta: passageiro.status_conta
            }
        });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao fazer login.' });
    }
}

async function uploadDocumentos(req, res) {
    try {
        const { id } = req.usuario;
        const arquivos = req.files;
        const atualizacoes = {};

        if (arquivos && arquivos.rg) {
            atualizacoes.rg_foto_url = `/uploads/passageiros/${id}/${arquivos.rg[0].filename}`;
        }
        if (arquivos && arquivos.cnh) {
            atualizacoes.cnh_foto_url = `/uploads/passageiros/${id}/${arquivos.cnh[0].filename}`;
        }
        if (arquivos && arquivos.foto_perfil) {
            atualizacoes.foto_perfil_url = `/uploads/passageiros/${id}/${arquivos.foto_perfil[0].filename}`;
        }

        const passageiroAtualizado = await Passageiro.atualizarDocumentos(id, atualizacoes);
        res.json({
            mensagem: 'Documentos enviados com sucesso! Aguardando análise.',
            passageiro: passageiroAtualizado
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao enviar documentos.' });
    }
}

async function quitarDebito(req, res) {
    try {
        const passageiroId = req.usuario.id; 
        const { metodoPagamento } = req.body; // Pega como o app enviou (ex: 'pix', 'cartao')

        // 1. Busca os dados no banco
        const consulta = await pool.query('SELECT debito_pendente FROM passageiros WHERE id = $1', [passageiroId]); 

        // 2. Se não encontrou o passageiro no banco
        if (consulta.rows.length === 0) { 
            return res.status(404).json({ erro: 'Passageiro não encontrado.' });
        }

        const debitoAtual = parseFloat(consulta.rows[0].debito_pendente);

        // 3. Se o passageiro não deve nada
        if (debitoAtual <= 0) {
            return res.status(400).json({ erro: 'Não há débito pendente para quitar.' });
        } 

        // --- INTEGRAÇÃO FUTURA ---
        // Aqui entraria a chamada real para a API do MercadoPago ou Stripe.

        // 4. Atualiza o débito do passageiro para zero
        await pool.query('UPDATE passageiros SET debito_pendente = 0.00 WHERE id = $1', [passageiroId]);
        
        // 5. Devolve o sucesso
        res.json({
            sucesso: true,
            mensagem: 'Débito quitado com sucesso! Você já pode solicitar corridas em dinheiro.',
            valor_pago: debitoAtual,
            metodo_pagamento: metodoPagamento || 'pix'
        });

    } catch (erro) {
        console.error('Erro ao processar quitação de débito:', erro);
        res.status(500).json({ erro: 'Erro ao processar quitação de débito.' });
    }       
}
module.exports = { cadastrar, listar, login, uploadDocumentos, quitarDebito };