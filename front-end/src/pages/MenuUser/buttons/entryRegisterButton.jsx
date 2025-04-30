import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Importar Toastify
import 'react-toastify/dist/ReactToastify.css'; // Importar estilos do Toastify

const EntryButton = ({ username }) => {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const checkEntry = async () => {
      try {
        const response = await fetch('http://localhost:4005/users/checkEntry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        if (data.hasEntry) {
          setIsDisabled(true);
        }
      } catch (error) {
        console.error('Erro ao verificar entrada:', error);
      }
    };

    checkEntry();
  }, [username]);

  const handleClick = async () => {
    const now = new Date();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      const response = await fetch('http://localhost:4005/users/registerEntry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ time: formattedTime, username })
      });

      if (!response.ok) {
        throw new Error('Erro ao registrar a entrada');
      }
      
      toast.success(`Entrada registada às ${formattedTime}`, { position: 'top-right', autoClose: 3000 }); // Exibir toast
      setIsDisabled(true);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <button className="btn-menu gradient-border" onClick={handleClick} disabled={isDisabled}>
      {isDisabled ? 'Entrada Já Registrada' : 'Registrar Entrada'}
    </button>
  );
};

export default EntryButton;
