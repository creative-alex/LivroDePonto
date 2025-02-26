const { db } = require('../db/firebase'); 

// Função de validação
const validateUser= (userData) => {
  const errors = [];

  if (!userData.nome || typeof userData.nome !== 'string') {
    errors.nome = 'Nome é obrigatório e deve ser uma string';
  }

  if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.email = 'Email é obrigatório e deve ser válido';
  }

  return errors;
};

module.exports = { validateUser };