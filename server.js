const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Credenciais oficiais da SmartPOS configuradas
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

// Rota de busca de produtos (exige page e size conforme a documentação)
app.get('/api/produtos', async (req, res) => {
  try {
    const { search } = req.query;
    
    const params = {
      page: 1,
      size: 100
    };
    
    if (search) {
      params.name = search; // Filtro oficial por nome do produto
    }

    const response = await client.get('/products', { params });
    const rawData = response.data;
    
    // Extrai a lista de produtos da resposta paginada
    const listaProdutos = Array.isArray(rawData) 
      ? rawData 
      : (rawData?.items || rawData?.data || []);

    res.json(listaProdutos);
  } catch (error) {
    const status = error.response?.status || 500;
    const details = error.response?.data || error.message;
    console.error('Erro na API SmartPOS:', status, details);
    
    res.status(status).json({ 
      error: 'Falha ao buscar produtos na SmartPOS', 
      status: status,
      details: details 
    });
  }
});

// Rota para criação de vendas
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
    const status = error.response?.status || 500;
    const details = error.response?.data || error.message;
    console.error('Erro ao criar venda:', status, details);
    
    res.status(status).json({ 
      error: 'Falha ao criar venda na SmartPOS', 
      status: status,
      details: details 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
