import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import capa from '../../../../assets/capa.jpg';
import LogoutButton from '../../../../components/LogoutButton/logoutButton';


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
      const response = await fetch('https://api-ls3q.onrender.com/entity/createEntity', {
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

  const handleLogout = () => {
    localStorage.removeItem("user");
  };

  return (
    <>
     <div className="cut">
              <img src={capa} alt="Capa" className="capa cut" />
      </div>
      <LogoutButton onLogout={handleLogout} />
       <div className="flex-center nav-container">
                <Link to="/entidades">
                    <button className="btn-menu gradient-border">Entidades & Users </button>
                  </Link>
                  <Link to="/nova-entidade">
                    <button className="btn-menu gradient-border">Criar Entidade</button>
                  </Link>
                  <Link to="/novo-user">
                    <button className="btn-menu gradient-border">Criar User</button>
                  </Link>
            </div>
    <div className="form-container center gradient-border">
      <h2>Criação de Nova Entidade</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nome">Nome:</label>
          <input
            id="nome"
            type="text"
            className="create-input"
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
            className="create-input"
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
            className="create-input"
            value={nif}
            minLength={9}
            maxLength={9}
            onChange={(e) => setNif(e.target.value)}
            required
          />
        </div>

        <button className="btn login" type="submit">→</button>
      </form>

      <ToastContainer />
    </div>
    </>
  );
};

export default NovaEntidade;
