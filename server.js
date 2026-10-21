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
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30); // Últimos 30 dias para garantir

    const start = past.toISOString();
    const end = now.toISOString();

    // Tenta buscar as vendas com os parâmetros oficiais
    const response = await client.get(`/sales?start=${start}&end=${end}`);
    let sales = response.data;
    if (sales?.items) sales = sales.items;

    if (!Array.isArray(sales)) {
      sales = [];
    }

    // Mostra no console do Render os dados brutos para sabermos exatamente o campo de status
    if (sales.length > 0) {
      console.log('Exemplo de venda recebida:', JSON.stringify(sales[0], null, 2));
    }

    // Retorna todas as vendas para exibirmos e validarmos na tela
    res.json(sales);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar pedidos', details: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
