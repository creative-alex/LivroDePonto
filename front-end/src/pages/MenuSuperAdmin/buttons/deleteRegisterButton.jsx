import React from 'react';

const DeleteRegister = ({ username, date, onDelete }) => {
  const apagarRegistro = async () => {
    try {
      const response = await fetch("http://localhost:4005/users/deleteRegister", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, date }),
      });

      if (!response.ok) {
        throw new Error("Erro ao apagar o registro");
      }

      console.log("🗑️ Registro apagado para o dia:", date);
      if (onDelete) onDelete(date);
    } catch (error) {
      console.error("❌ Erro ao apagar registro:", error);
    }
  };

  return (
    <button onClick={apagarRegistro}>
      Apagar Registro
    </button>
  );
};

export default DeleteRegister;