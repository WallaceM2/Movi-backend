const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiroController');
const { limiteLogin } = require('../middlewares/rateLimiter');
const validar = require('../middlewares/validar');
const { cadastroPassageiroSchema, loginSchema } = require('../validators/passageiroValidator');



router.post('/passageiros', validar(cadastroPassageiroSchema), passageiroController.cadastrar);
router.get('/passageiros', passageiroController.listar);
router.post('/passageiros/login', limiteLogin, validar(loginSchema), passageiroController.login);


module.exports = router;