import React, { useState } from 'react';

const RegisterVacation = ({ username, date, onSuccess }) => {
  const [ferias, setFerias] = useState([]);

  const marcarFerias = async () => {
    if (!ferias.includes(date)) {
      try {
        const response = await fetch("https://api-ls3q.onrender.com/users/vacation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, date }),
        });

        setFerias([...ferias, date]);
        if (onSuccess) onSuccess(); // Chama a função passada como prop
      } catch (error) {
        console.error("❌ Erro ao marcar férias:", error);
      }
    }
  };

  return (
    <button onClick={marcarFerias}>
      Marcar como Férias
    </button>
  );
};

export default RegisterVacation;
