import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

      // ✅ Notificação de Sucesso
      toast.success('Entidade criada com sucesso!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      // Limpa os campos
      setNome('');
      setMorada('');
      setNif('');
    } catch (error) {
      console.error('Erro ao enviar requisição:', error);

      // ❌ Notificação de Erro
      toast.error(`Erro: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    }
  };

  return (
    <div className="form-container center gradient-border">
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
            minLength={9}
            maxLength={9}
            onChange={(e) => setNif(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Criar Entidade
        </button>
      </form>

      <ToastContainer />
    </div>
  );
};

export default NovaEntidade;
