const Motorista = require('../models/Motorista');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

    async function login(req, res) {
  console.log('🔵 LOGIN INICIADO - dados recebidos:', req.body);

  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    const motorista = await Motorista.buscarPorEmail(email);
    console.log('🔵 Motorista encontrado?', motorista ? 'SIM' : 'NÃO');

    if (!motorista) {
      return res.status(401).json({ erro: 'Email ou senha inválidos.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, motorista.senha_hash);
    console.log('🔵 Senha bateu?', senhaCorreta);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Email ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: motorista.id, tipo: 'motorista', categoria: motorista.categoria },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🔵 Token gerado com sucesso!');

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      motorista: {
        id: motorista.id,
        nome: motorista.nome,
        sobrenome: motorista.sobrenome,
        email: motorista.email,
        status_cadastro: motorista.status_cadastro
      }
    });

  } catch (erro) {
    console.log('🔴 CAIU NO CATCH! Erro completo abaixo:');
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao fazer login.' });
  }
}

    async function cadastrar (req, res) {
        try {
            const { nome, sobrenome, email, senha, cpf, categoria } = req.body;
                // Validacao basica antes de ir pro banco
            if (!nome || !sobrenome || !email || !senha || !cpf || !categoria) {
                return res.status(400).json({
                        erro: 'Campos obrigatórios: nome, sobrenome, email, cpf, categoria'
                });
            }

            if (!['moto', 'carro'].includes(categoria)) {
                    return res.status(400).json({ erro: 'Categoria deve ser "Moto" ou "Carro"'});
            }

            const novoMotorista = await Motorista.criar(req.body);
            res.status(201).json({
                mensagem: 'Motorista cadastrado! Aguardando análise de documentos.',
                motorista: novoMotorista
            });
        } catch (erro) {
            //Erro comum -> CPF ou EMAIL duplicado ( por causa do UNIQUE na tabela)
            if (erro.code === '23505') {
                    return res.status(409).json({ erro: 'CPF ou email ja cadastrado.'});
            }
            console.error(erro);
            res.status(500).json({ erro: 'Erro ao cadastrar motorista.'});
        }
    }

    async function listar(req, res) {
        try {
            const motoristas = await Motorista.listarTodos();
            res.json(motoristas);
        } catch (erro) {
            console.error(erro);
            res.status(500).json({ erro: 'Erro ao buscar motoristas.'});
        }
    }

    async function uploadDocumentos(req, res) {
      try {
        const { id } = req.usuario; // vem do token, não do body — mais seguro
        const arquivos = req.files;
        const atualizacoes = {};
          if (arquivos.rg) {
            atualizacoes.rg_foto_url = `/uploads/motoristas/${id}/${arquivos.rg[0].filename}`;
          }
          if (arquivos.cnh) {
            atualizacoes.cnh_foto_url = `/uploads/motoristas/${id}/${arquivos.cnh[0].filename}`;
          }
          if (arquivos.foto_perfil) {
            atualizacoes.foto_perfil_url = `/uploads/motoristas/${id}/${arquivos.foto_perfil[0].filename}`;
          }
          if (arquivos.documento_veiculo) {
            atualizacoes.documento_veiculo_url = `/uploads/motoristas/${id}/${arquivos.documento_veiculo[0].filename}`;
          }

          const motoristaAtualizado = await Motorista.atualizarDocumentos(id, atualizacoes);

          res.json({
            mensagem: 'Documentos enviados com sucesso! Aguardando análise.',
            motorista: motoristaAtualizado
          });
      } catch (erro) {
        console.log(erro);
          res.status(500).json({ erro: 'Erro ao enviar documentos.'});
      }
    }
module.exports = {cadastrar, listar, login, uploadDocumentos};