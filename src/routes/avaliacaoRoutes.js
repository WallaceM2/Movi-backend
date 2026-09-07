const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const verificarToken = require('../middlewares/autenticacao');
const validar = require('../middlewares/validar');
const { avaliacaoSchema } = require('../validators/avaliacaoValidator');

// Qualquer usuário autenticado (motorista ou passageiro) pode criar uma avaliação
router.post('/avaliacoes', verificarToken, validar(avaliacaoSchema), avaliacaoController.criar);

// Ver todas as avaliações recebidas por um motorista ou passageiro específico
router.get('/avaliacoes/:tipo/:id', verificarToken, avaliacaoController.listarPorAvaliado);

module.exports = router;