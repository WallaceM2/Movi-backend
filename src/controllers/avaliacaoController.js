const Avaliacao = require('../models/Avaliacao');

async function criar(req, res) {
  try {
    const { avaliado_tipo, avaliado_id, nota, tag, comentario } = req.body;

    // Quem está avaliando vem do token, nunca do body (segurança)
    const avaliador_tipo = req.usuario.tipo;
    const avaliador_id = req.usuario.id;

    // Regra de negócio: motorista só avalia passageiro, e vice-versa
    if (avaliador_tipo === avaliado_tipo) {
      return res.status(400).json({
        erro: 'Motorista só pode avaliar passageiro, e passageiro só pode avaliar motorista.'
      });
    }

    const novaAvaliacao = await Avaliacao.criar({
      avaliado_tipo, avaliado_id, avaliador_tipo, avaliador_id, nota, tag, comentario
    });

    const perfilAtualizado = await Avaliacao.atualizarMedia(avaliado_tipo, avaliado_id, nota);

    res.status(201).json({
      mensagem: 'Avaliação registrada com sucesso!',
      avaliacao: novaAvaliacao,
      novaMedia: perfilAtualizado
    });

  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao registrar avaliação.' });
  }
}

async function listarPorAvaliado(req, res) {
  try {
    const { tipo, id } = req.params;

    if (!['motorista', 'passageiro'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo deve ser "motorista" ou "passageiro".' });
    }

    const avaliacoes = await Avaliacao.listarPorAvaliado(tipo, id);
    res.json(avaliacoes);

  } catch (erro) {
    console.log(erro);
    res.status(500).json({ erro: 'Erro ao buscar avaliações.' });
  }
}

module.exports = { criar, listarPorAvaliado };