const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SMARTPOS_TOKEN = process.env.SMARTPOS_TOKEN || 'EwFwjyG-N9LvbpYLfT2MShsB2eFUyRCVHPJwaY7em8N5UO3Fsw6gvv6jjKgAS80tCyqbHWMob8dZjJK6TBSE7A';
const SMARTPOS_BASE_URL = 'https://api.smartpos.app/v1';

const client = axios.create({
  baseURL: SMARTPOS_BASE_URL,
  headers: {
    'Authorization': `Bearer ${SMARTPOS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

app.get('/api/produtos', async (req, res) => {
  try {
    const { search } = req.query;
    const response = await client.get('/products', {
      params: { q: search }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Falha ao buscar produtos na SmartPOS' });
  }
});

app.post('/api/vendas', async (req, res) => {
  try {
    const { items, status } = req.body;

    const payload = {
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      status: status || 'OPEN'
    };

    const response = await client.post('/sales', payload);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Erro ao criar venda:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: 'Falha ao criar venda na SmartPOS', 
      details: error?.response?.data 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
