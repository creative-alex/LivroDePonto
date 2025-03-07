import React, { useState } from 'react';

const RegisterVacation = ({ username, date }) => {
  const [ferias, setFerias] = useState([]);

  const marcarFerias = async () => {
    if (!ferias.includes(date)) {
      console.log("🌴 Marcando férias para o dia:", date);
      try {
        const response = await fetch("http://localhost:4005/users/vacation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, date }),
        });

        console.log("📩 Resposta do servidor para férias:", response);
        setFerias([...ferias, date]);
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
