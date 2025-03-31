import React, { useState, useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom"; // Importando useNavigate

const FirstLoginComponent = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const { userEmail } = useContext(UserContext);
  const navigate = useNavigate(); // Usando o hook useNavigate para navegação

  const handlePasswordChange = async () => {
    try {
      if (!userEmail) {
        throw new Error("Erro: usuário não encontrado.");
      }
      
      const response = await fetch("http://localhost:4005/users/updateFirstLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erro ao atualizar senha");

      // Redireciona para /home após a alteração bem-sucedida
      navigate("/home");

      onComplete(); // Fecha o componente após sucesso
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="form-container center gradient-border">
      <h2>Alterar Senha</h2>
      <input
        type="password"
        placeholder="Nova Senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="form-input"
      />
      <button className="btn" style={{ marginTop: "10px" }} onClick={handlePasswordChange}>Confirmar</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default FirstLoginComponent;
