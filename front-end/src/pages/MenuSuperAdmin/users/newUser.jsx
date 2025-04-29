import React, { useState } from 'react';
import EntidadeSelect from '../combobox/allEntitiesSelect';
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import capa from '../../../assets/capa.jpg';
import LogoutButton from '../../../components/LogoutButton/logoutButton';
import { useNavigate, useLocation, Link } from "react-router-dom"; // Importar Link e useLocation


const auth = getAuth();

const NewUser = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [entidade, setEntidade] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    // Validação do formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor, insira um e-mail válido.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return;
    }

    const newUser = { nome, email, entidade, role };

    try {
      // 1️⃣ Criar o usuário no banco de dados
      const response = await fetch('http://localhost:4005/users/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar user no banco de dados');
      }

      // 2️⃣ Criar o usuário no Firebase Authentication
      await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Notificação de Sucesso
      toast.success('User criado com sucesso!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });

      // Limpar campos
      setNome('');
      setEmail('');
      setPassword('');
      setEntidade('');
      setRole('');
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
      console.error('Erro ao processar a requisição:', error);

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

      // Remover usuário do banco de dados em caso de erro no Firebase
      if (error.message.includes("auth/") && email) {
        await fetch('http://localhost:4005/users/deleteUser', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).then(() => console.log("User removido da BD devido a erro no Firebase"))
          .catch(err => console.error("Erro ao remover user da BD:", err));
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
  };

  return (
    <>
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
    <div style={{ width: '30vw' }}>
      <div className="cut">
          <img src={capa} alt="Capa" className="capa cut" />
      </div>
          <LogoutButton onLogout={handleLogout} />
      </div>
    <div className="form-container center gradient-border">
      <h2>Criação de Novo User</h2>
      {message && <p className="error-unique">{message}</p>}
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
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            className="create-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            className="create-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Função:</label>
          <input
            id="role"
            type="text"
            className="create-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="entidade">Entidade:</label>
          <EntidadeSelect
            id="entidade"
            className="form-select"
            value={entidade}
            onChange={(e) => setEntidade(e.target.value)}
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

export default NewUser;
