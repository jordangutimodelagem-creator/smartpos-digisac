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

// Busca de produtos mapeando o sellValue correto
app.get('/api/produtos', async (req, res) => {
  try {
    const { search } = req.query;
    const params = { page: 1, size: 100 };
    if (search) params.name = search;

    const response = await client.get('/products', { params });
    const rawData = response.data;
    
    let lista = Array.isArray(rawData) ? rawData : (rawData?.items || rawData?.data || []);
    
    // Padroniza o preço para sellValue
    const produtosFormatados = lista.map(p => ({
      id: p.id,
      name: p.name || p.description,
      price: p.sellValue || p.price || 0
    }));

    res.json(produtosFormatados);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: 'Erro ao buscar produtos', details: error.response?.data || error.message });
  }
});

// Criação de vendas com suporte a Cliente e Atendente
app.post('/api/vendas', async (req, res) => {
  try {
    const { items, status, customerName, sellerName } = req.body;
    
    const payload = {
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      status: status || 'OPEN'
    };

    if (customerName) {
      payload.customer = { companyName: customerName, type: 'CLIENTE', personType: 'FISICA' };
    }
    if (sellerName) {
      payload.seller = { name: sellerName };
    }

    const response = await client.post('/sales', payload);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Erro ao criar venda:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Falha ao criar venda na SmartPOS', 
      details: error.response?.data || error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
