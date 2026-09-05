const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Motorista = require('../models/Motorista');
const Passagerio = require('../models/Passageiro');

async function login(req, res) {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ erro:  'Email e senha são obrigatórios.'});
        }

        const admin = await Admin.buscarPorEmail(email);
        if (!admin) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.'});
        }

        const senhaCorreta = await bcrypt.compare(senha, admin.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.'});
        }

        const token = jwt.sign (
            { id: admin.id, tipo: 'admin'},
            process.env.JWT_SECRET,
            { expiresIn: '7d'}
        );

        res.json({
            mensagem: 'Login de admin realizado com sucesso!',
            token,
            admin: { id: admin.id, nome: admin.nome, email: admin.email }
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao fazer login.'});
    }
}

// Lista TODOS os motoristas, com todos os detalhes (admin pode ver tudo)
async function listarMotoristas (req, res ) {
    try {
        const motoristas = await Motorista.listarTodos();
        res.json(motoristas);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao buscar motoristas.'});
    }
}

// Lista TODOS os passageiros
async function listarPassageiros(req, res) {
    try {
        const passageiros = await Passageiro.listarTodos();
        res.json(passageiros);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: 'Erro ao buscar passageiros.'});
    }
}

// Ver detalhes de um motorista específico (documentos, status atual, etc)

    async function verMotorista(req, res) {
        try {
            const { id } = req.params;
            const motorista = await Motorista.buscarPorId(id);

            if (!motorista) {
                return res.status(404).json({ erro: 'Motorista não encontrado.'});
            }
                res.json(motorista);
        } catch (erro) {
            console.log(erro);
            res.status(500).json({ erro: 'Erro ao buscar motorista.' });
        }
    }

    // Aprova ou reprova o cadastro de um motorista
    async function atualizarStatusMotorista(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
                const statusValido = ['em_analise', 'aprovado', 'reprovado', 'suspenso', 'banido']; 

                    if (!statusValido.includes(status)) {
                        return res.status(400).json({
                            erro: `Status inválido. Use um dos: ${statusValidos.join(', ')}`
                        });
                    }

            const motoristaAtualizado = await Motorista.atualizarStatus(id, status);
                    if (!motoristaAtualizado) {
                        return res.status(404).json({ erro: 'Motorista não encontrado.'});
                    }

                    res.json({
                        mensagem: `Status do motorista atualizado para "${status}".`,
                        motorista: motoristaAtualizado
                    });
        } catch (erro) {
            console.log(erro);
            res.status(500).json({ erro: 'Erro ao atualizar status do motorista.' });
        }
    }

module.exports = { login, listarMotoristas, listarPassageiros, verMotorista, atualizarStatusMotorista };