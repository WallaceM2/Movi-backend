const express = require('express');
const router = express.Router();
const motoristaController = require('../controllers/motoristaController');
const verificarToken = require('../middlewares/autenticacao');

// Rota de teste, protegida pelo middleware
router.get('/motoristas/perfil', verificarToken, (req, res) => {
    res.json({
        mensagem: 'Você está autenticado!',
        dadosDoToken: req.usuario
    });
});
router.post('/motoristas', motoristaController.cadastrar);
router.get('/motoristas', motoristaController.listar);
router.post('/motoristas/login', motoristaController.login);

module.exports = router;