const Motorista = require('../models/Motorista');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function cadastrar(req, res) {
    try {
        const { nome, sobrenome, email, senha, telefone, data_nascimento, cpf, estado, categoria } = req.body;
        
        // Validação básica de campos obrigatórios
        if (!nome || !sobrenome || !email || !senha || !cpf || !estado || !categoria) {
            return res.status(400).json({
                erro: 'Campos obrigatórios ausentes. Verifique nome, sobrenome, email, senha, cpf, estado e categoria.'
            });
        }

        const novoMotorista = await Motorista.criar(req.body);
        
        res.status(201).json({
            mensagem: 'Motorista cadastrado com sucesso!',
            motorista: novoMotorista
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
            erro: 'Erro interno ao cadastrar motorista.',
            detalhe_tecnico: mensagemErro,
            json_completo: detalhesExtras
        });
    }
}

async function listar(req, res) {
    try {
        const motoristas = await Motorista.listarTodos();
        res.json(motoristas);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao buscar motoristas.' });
    }
}

async function login(req, res) {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
        }

        const motorista = await Motorista.buscarPorEmail(email);

        if (!motorista) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const senhaCorreta = await bcrypt.compare(senha, motorista.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { id: motorista.id, tipo: 'motorista' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            mensagem: 'Login realizado com sucesso!',
            token,
            motorista: {
                id: motorista.id,
                nome: motorista.nome,
                sobrenome: motorista.sobrenome,
                email: motorista.email,
                status_cadastrado: motorista.status_cadastrado
            }
        });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao fazer login.' });
    }
}

async function uploadDocumentos(req, res) {
    try {
        // A lógica de integração com o banco virá depois, 
        // mas a função precisa existir para a rota não quebrar.
        res.json({ mensagem: 'Rota de upload de documentos do motorista acessada com sucesso!' });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao processar documentos.' });
    }
}

module.exports = { cadastrar, listar, login, uploadDocumentos };