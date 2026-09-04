const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiroController');

router.post('/passageiros', passageiroController.cadastrar);
router.get('/passageiros', passageiroController.listar);
router.post('/passageiros/login', passageiroController.login);

module.exports = router;