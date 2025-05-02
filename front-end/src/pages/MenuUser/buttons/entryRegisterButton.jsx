import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Importar Toastify
import 'react-toastify/dist/ReactToastify.css'; // Importar estilos do Toastify

const EntryButton = ({ username }) => {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (!username) {
      console.warn('Username não definido. Abortando verificação.');
      return;
    }

    const checkEntry = async () => {
      try {
        console.log('Verificando entrada para o usuário:', username); // Log para depuração
        const response = await fetch("https://livrodeponto-fd4b.onrender.com/users/checkEntry", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        console.log('Resposta da API:', data); // Log para depuração
        if (data.hasEntry) {
          setIsDisabled(true);
        }
      } catch (error) {
        console.error('Erro ao verificar entrada:', error);
        if (error.message.includes('500')) {
          toast.error('Erro interno no servidor. Tente novamente mais tarde.', { position: 'top-right', autoClose: 3000 });
        } else {
          toast.error('Erro ao verificar entrada. Tente novamente mais tarde.', { position: 'top-right', autoClose: 3000 });
        }
      }
    };

    checkEntry();
  }, [username]);

  const handleClick = async () => {
    const now = new Date();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      const response = await fetch('https://api-ls3q.onrender.com/users/registerEntry', {
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
