import React, { useState } from 'react';

const MedicalLeaveButton = ({ username, date, onSuccess }) => {
  const [medicalLeaves, setMedicalLeaves] = useState([]);

  const marcarBaixaMedica = async () => {
    if (!medicalLeaves.includes(date)) {
      try {
        const response = await fetch("https://api-ls3q.onrender.com/users/medicalLeave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, date }),
        });

        setMedicalLeaves([...medicalLeaves, date]);
        if (onSuccess) onSuccess(); // Chama a função passada como prop
      } catch (error) {
        console.error("❌ Erro ao marcar baixa médica:", error);
      }
    }
  };

  return (
    <button onClick={marcarBaixaMedica}>
      Marcar como Baixa Médica
    </button>
  );
};

export default MedicalLeaveButton;