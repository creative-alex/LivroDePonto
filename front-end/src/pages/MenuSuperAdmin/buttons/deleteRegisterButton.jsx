import React from 'react';

const DeleteRegister = ({ username, date, onDelete, onSuccess }) => {
  const apagarregisto = async () => {
    try {
      const response = await fetch("http://localhost:8080/users/deleteRegister", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, date }),
      });

      if (!response.ok) {
        throw new Error("Erro ao apagar o registo");
      }

      if (onDelete) onDelete(date);
      if (onSuccess) onSuccess(); 
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