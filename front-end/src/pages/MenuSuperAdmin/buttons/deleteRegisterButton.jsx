import React from 'react';

const DeleteRegister = ({ username, date, onDelete }) => {
  const apagarregisto = async () => {
    try {
      const response = await fetch("http://localhost:4005/users/deleteRegister", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, date }),
      });

      if (!response.ok) {
        throw new Error("Erro ao apagar o registo");
      }

      console.log("🗑️ registo apagado para o dia:", date);
      if (onDelete) onDelete(date);
    } catch (error) {
      console.error("❌ Erro ao apagar registo:", error);
    }
  };

  return (
    <button onClick={apagarregisto}>
      Apagar registo
    </button>
  );
};

export default DeleteRegister;