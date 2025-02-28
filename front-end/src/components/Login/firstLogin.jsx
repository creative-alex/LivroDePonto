import React, { useState, useContext } from "react";
import { UserContext } from "../../context/UserContext";


const FirstLoginComponent = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const { userEmail } = useContext(UserContext);
  console.log("Email recebido do index" ,{userEmail});

  const handlePasswordChange = async () => {
    try {
      if (!userEmail) {
        throw new Error("Erro: Usuário não encontrado.");
      }
      
      console.log("Email enviado:", userEmail); // 🔍 Verifica o email antes da requisição
  
      const response = await fetch("http://localhost:4005/users/updateFirstLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, newPassword }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erro ao atualizar senha");
  
      onComplete(); // Fecha o componente após sucesso
    } catch (error) {
      setError(error.message);
    }
  };
  

  return (
    <div>
      <h2>Alterar Senha</h2>
      <input
        type="password"
        placeholder="Nova Senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handlePasswordChange}>Confirmar</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default FirstLoginComponent;
