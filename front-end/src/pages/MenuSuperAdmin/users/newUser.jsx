import React, { useState } from 'react';
import EntidadeSelect from '../combobox/allEntitiesSelect';
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const auth = getAuth();

const NewUser = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [entidade, setEntidade] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole]= useState('')

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const newUser = { nome, email, entidade, role };

    try {
      // 1️⃣ Primeiro, criar o user no banco de dados
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

      // 2️⃣ Se deu certo, criar o user no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      setMessage('user criado com sucesso!');

      // Limpa os campos
      setNome('');
      setEmail('');
      setPassword('');
      setEntidade('');
      setRole('');
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
      console.error('Erro ao processar a requisição:', error);

      // Se houve erro na criação no Authentication, remover da BD
      if (error.message.includes("auth/") && email) {
        await fetch('http://localhost:4005/users/deleteUser', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).then(() => console.log("user removido da BD devido a erro no Firebase"))
          .catch(err => console.error("Erro ao remover user da BD:", err));
      }
    }
  };

  return (
    <div className="nova-entidade-container-unique">
  <h2>Criação de Novo user</h2>
  {message && <p className="error-unique">{message}</p>}
  <form onSubmit={handleSubmit} className="nova-entidade-container-entidade">
    <div className="form-group-unique form-group-entidade">
      <label htmlFor="nome">Nome:</label>
      <input
        type="text"
        id="nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
      />
    </div>
    <div className="form-group-unique form-group-entidade">
      <label htmlFor="email">Email:</label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>
    <div className="form-group-unique form-group-entidade">
      <label htmlFor="password">Password:</label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>
    <div className="form-group-unique form-group-entidade">
      <label htmlFor="role">Função:</label>
      <input
        type="text"
        id="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        required
      />
    </div>
    <div className="form-group-unique form-group-entidade">
      <label htmlFor="entidade">Entidade:</label>
      <EntidadeSelect
        id="entidade"
        value={entidade}
        onChange={(e) => {
          console.log("Entidade selecionada:", e.target.value);
          setEntidade(e.target.value);
        }}
        required
      />
    </div>
    <button type="submit">Criar user</button>
  </form>
</div>
  );
};

export default NewUser;
