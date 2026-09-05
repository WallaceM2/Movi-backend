const express = require('express');
const router = express.Router();
const motoristaController = require('../controllers/motoristaController');
const verificarToken = require('../middlewares/autenticacao');
const { limiteLogin } = require('../middlewares/rateLimiter');
const validar = require('../middlewares/validar');
const { cadastroMotoristaSchema, loginSchema } = require('../validators/motoristaValidator');

// Rota de teste, protegida pelo middleware
router.get('/motoristas/perfil', verificarToken, (req, res) => {
    res.json({
        mensagem: 'Você está autenticado!',
        dadosDoToken: req.usuario
    });
});

router.post('/motoristas', validar(cadastroMotoristaSchema), motoristaController.cadastrar);
router.get('/motoristas', motoristaController.listar);
router.post('/motoristas/login', limiteLogin, validar(loginSchema), motoristaController.login);

module.exports = router;