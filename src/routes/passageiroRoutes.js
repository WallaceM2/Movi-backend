const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiroController');
const { limiteLogin } = require('../middlewares/rateLimiter');



router.post('/passageiros', passageiroController.cadastrar);
router.get('/passageiros', passageiroController.listar);
router.post('/passageiros/login', passageiroController.login);
router.post('/passageiros/login', limiteLogin, passageiroController.login);

module.exports = router;