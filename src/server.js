const express = require ('express');
require('dotenv').config();

// importa a conexao com o banco ( isso ja testa a conexao ao carregar )
require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que o servidor entenda o JSON no corpo das requisicoes
app.use(express.json());

const motoristaRoutes = require('./routes/motoristaRoutes');
app.use('/api', motoristaRoutes);

// Rota de teste simpes, só pra confirmar que o servidor está de pé
app.get('/', (req, res) => {
    res.json({ mensagem: '🏍️ API do app de corridas está rodando!'});
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

const passageiroRoutes = require('./routes/passageiroRoutes');
app.use('/api', passageiroRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api', adminRoutes);