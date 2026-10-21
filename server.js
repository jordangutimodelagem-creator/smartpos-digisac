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
    past.setDate(now.getDate() - 7);

    const start = past.toISOString();
    const end = now.toISOString();

    const response = await client.get(`/sales?start=${start}&end=${end}`);
    let sales = response.data;
    if (sales?.items) sales = sales.items;

    if (!Array.isArray(sales)) {
      sales = [];
    }

    // Filtra apenas os pedidos em aberto (status OPEN ou similar, ou sem nota fiscal finalizada)
    const pedidosAbertos = sales.filter(s => {
      const status = (s.status || s.statusNf || '').toUpperCase();
      // Considera aberto se o status for OPEN ou se não tiver nota fiscal/sucesso definitivo
      return status === 'OPEN' || status === 'PROCESSING' || (!s.numberInvoice && status !== 'SUCCESS');
    });

    res.json(pedidosAbertos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error.response?.data || error.message);
    res.status(500).json({ error: 'Não se pudieron cargar los pedidos', details: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
