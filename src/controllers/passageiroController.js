const Passageiro = require('../models/Passageiro');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
        console.log(erro);
        res.status(500).json({ 
            erro: 'Erro interno ao cadastrar passageiro.',
            detalhe_tecnico: erro.message 
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

module.exports = { cadastrar, listar, login, uploadDocumentos };