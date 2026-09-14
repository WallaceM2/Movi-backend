const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const verificarToken = require('../middlewares/autenticacao');
const upload = require('../middlewares/upload');

router.post('/documentos/cnh', verificarToken, upload.single('foto'), documentoController.enviarCnh);


module.exports = router;