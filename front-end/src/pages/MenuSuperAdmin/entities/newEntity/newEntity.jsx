import React, { useState } from 'react';

const NovaEntidade = () => {
  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [nif, setNif] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const novaEntidade = {
      nome,
      morada,
      nif: Number(nif),
    };

    try {
      const response = await fetch('http://localhost:4005/entity/createEntity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novaEntidade),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar entidade');
      }

      const data = await response.json();
      console.log('Entidade criada com sucesso:', data);
      
      // Limpa os campos ou exibir uma mensagem de sucesso
      setNome('');
      setMorada('');
      setNif('');
    } catch (error) {
      console.error('Erro ao enviar requisição:', error);
    }
  };

  return (
    <div className="form-container gradient-border">
      <h2>Criação de Nova Entidade</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nome">Nome:</label>
          <input
            id="nome"
            type="text"
            className="form-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
  
        <div className="form-group">
          <label htmlFor="morada">Morada:</label>
          <input
            id="morada"
            type="text"
            className="form-input"
            value={morada}
            onChange={(e) => setMorada(e.target.value)}
            required
          />
        </div>
  
        <div className="form-group">
          <label htmlFor="nif">NIF:</label>
          <input
            id="nif"
            type="text"
            className="form-input"
            value={nif}
            onChange={(e) => setNif(e.target.value)}
            required
          />
        </div>
  
        <button className="btn btn-primary" type="submit">
          Criar Entidade
        </button>
      </form>
    </div>
  );  
};

export default NovaEntidade;
