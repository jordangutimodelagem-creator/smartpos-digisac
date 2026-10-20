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
    // Tenta obter a lista de produtos
    const response = await client.get('/products');
    
    let products = response.data;
    if (products?.data) products = products.data;
    if (products?.products) products = products.products;

    if (!Array.isArray(products)) {
      products = [];
    }

    // Filtra pelo termo digitado se fornecido
    if (search && products.length > 0) {
      const term = search.toLowerCase();
      products = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.title && p.title.toLowerCase().includes(term))
      );
    }

    res.json(products);
  } catch (error) {
    const status = error.response?.status || 500;
    const details = error.response?.data || error.message;
    console.error('Erro na chamada SmartPOS:', status, details);
    
    // Retorna o motivo exato em JSON para vermos no console do navegador
    res.status(status).json({ 
      error: 'Erro na API SmartPOS', 
      status: status,
      details: details 
    });
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
    res.status(error.response?.status || 500).json({ 
      error: 'Falha ao criar venda na SmartPOS', 
      details: error.response?.data || error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
