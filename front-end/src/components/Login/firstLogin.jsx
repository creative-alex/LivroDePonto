import React, { useState, useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify"; // Importando Toastify
import "react-toastify/dist/ReactToastify.css"; // Importando estilos do Toastify

const FirstLoginComponent = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { userEmail } = useContext(UserContext);
  const navigate = useNavigate();

  const handlePasswordChange = async () => {
    try {
      if (!userEmail) {
        throw new Error("Erro: usuário não encontrado.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("As senhas não coincidem.");
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
      toast.error(error.message); // Exibe o erro como um toast
    }
  };

  return (
    <div className="form-container center gradient-border">
      <ToastContainer position="top-center" autoClose={3000} /> {/* Container para os toasts */}
      <h2>Alterar Senha</h2>
      <input
        type="password"
        placeholder="Nova Senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="form-input"
      />
      <input
        type="password"
        placeholder="Confirme a Nova Senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="form-input"
        style={{ marginTop: "10px" }}
      />
      <button className="btn" style={{ marginTop: "10px" }} onClick={handlePasswordChange}>
        Confirmar
      </button>
    </div>
  );
};

export default FirstLoginComponent;