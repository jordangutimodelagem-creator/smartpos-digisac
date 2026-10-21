const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY_ID = '6b1e922c-c6fa-43d5-a8f0-06272ad2211e';
const API_KEY_SECRET = 'EwFwjyG-N9LvbpYLfT2MShsB2eFUyRCVHPJwaY7em8N5UO3Fsw6gvv6jjKgAS80tCyqbHWMob8dZjJK6TBSE7A';
const SMARTPOS_BASE_URL = 'https://api.smartpos.app/v1';

const client = axios.create({
  baseURL: SMARTPOS_BASE_URL,
  headers: {
    'X-Api-Key-Id': API_KEY_ID,
    'X-Api-Key-Secret': API_KEY_SECRET,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

app.get('/api/pedidos-abertos', async (req, res) => {
  try {
    // Tenta buscar especificamente na rota de pedidos/orçamentos em aberto se houver, 
    // ou busca nas vendas gerais alargando o período e sem travar em filtros rígidos.
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 15); // Últimos 15 dias

    const start = past.toISOString();
    const end = now.toISOString();

    // Vamos buscar na rota de vendas e também testar se há parâmetros de status aberto
    let response;
    try {
      response = await client.get(`/sales?status=ABERTO&start=${start}&end=${end}`);
    } catch (err) {
      // Se der erro com o parâmetro, busca sem ele para inspecionar
      response = await client.get(`/sales?start=${start}&end=${end}`);
    }

    let sales = response.data;
    if (sales?.items) sales = sales.items;

    if (!Array.isArray(sales)) {
      sales = [];
    }

    // Filtra de forma inteligente para aceitar tanto status ABERTO, OPEN, quanto pedidos com prefixo PN-
    const pedidosAbertos = sales.filter(s => {
      const status = (s.status || '').trim().toUpperCase();
      const orderName = (s.orderName || s.code || '').trim().toUpperCase();
      
      return (
        status === 'ABERTO' || 
        status === 'OPEN' || 
        orderName.includes('PN-') ||
        status.includes('ABERT')
      );
    });

    // Se mesmo assim vier vazio, mandamos todas as vendas recentes para não ficar em branco e podermos ver os campos
    const resultadoFinal = pedidosAbertos.length > 0 ? pedidosAbertos : sales;

    res.json(resultadoFinal);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar pedidos', details: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
