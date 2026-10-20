
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
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Rota de busca de produtos corrigida e resiliente
app.get('/api/produtos', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Tenta primeiro com o parâmetro 'q' (padrão SmartPOS), depois sem parâmetros se necessário
    let response;
    try {
      response = await client.get('/products', { params: search ? { q: search } : {} });
    } catch (err) {
      response = await client.get('/products');
    }

    const rawData = response.data;
    
    // Extrai a lista de produtos de forma flexível
    let listaProdutos = Array.isArray(rawData) 
      ? rawData 
      : (rawData?.data || rawData?.products || rawData?.items || []);

    // Se a API não filtrar no servidor, filtra localmente pelo nome do produto
    if (search && Array.isArray(listaProdutos)) {
      const term = search.toLowerCase();
      const filtrados = listaProdutos.filter(p => 
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.title && p.title.toLowerCase().includes(term))
      );
      if (filtrados.length > 0) {
        listaProdutos = filtrados;
      }
    }

    res.json(listaProdutos);
  } catch (error) {
    console.error('Erro na API SmartPOS:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: 'Falha ao buscar produtos na SmartPOS', 
      details: error?.response?.data || error.message 
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
    console.error('Erro ao criar venda:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: 'Falha ao criar venda na SmartPOS', 
      details: error?.response?.data || error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
