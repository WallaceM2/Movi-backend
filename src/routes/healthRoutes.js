const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // Conexão com o PostgreSQL
const redisClient = require('../config/redis'); // Conexão com o Redis

router.get('/', async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        servicos: {
            api: 'UP',
            banco_de_dados: 'DOWN',
            redis: 'DOWN'
        }
    };

    try {
        // Teste de conexão ativa com o PostgreSQL
        await pool.query('SELECT 1');
        health.servicos.banco_de_dados = 'UP';
    } catch (error) {
        health.status = 'ERROR';
        console.error('🔴 Falha no Health Check (PostgreSQL):', error.message);
    }

    try {
        // Teste de conexão ativa com o Redis
        if (redisClient.isReady) {
            await redisClient.ping();
            health.servicos.redis = 'UP';
        } else {
            throw new Error('Cliente Redis não está pronto (isReady = false)');
        }
    } catch (error) {
        health.status = 'ERROR';
        console.error('🔴 Falha no Health Check (Redis):', error.message);
    }

    // Se algum serviço vital estiver offline, retorna 503 (Service Unavailable)
    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
});

module.exports = router;