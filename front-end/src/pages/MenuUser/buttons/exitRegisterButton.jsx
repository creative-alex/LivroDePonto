import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

const LeaveButton = ({ username }) => {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const checkLeave = async () => {
      try {
        const response = await fetch('https://api-ls3q.onrender.com/users/checkLeave', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        if (data.hasLeave) {
          setIsDisabled(true);
        }
      } catch (error) {
        console.error('Erro ao verificar saída:', error);
      }
    };

    checkLeave();
  }, [username]);

  const handleClick = async () => {
    const now = new Date();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      const response = await fetch('https://api-ls3q.onrender.com/users/registerLeave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ time: formattedTime, username })
      });

      if (!response.ok) {
        throw new Error('Erro ao registar a saída');
      }
      
      toast.success(`Saída registada às ${formattedTime}`, { position: 'top-right', autoClose: 3000 }); // Exibir toast
      setIsDisabled(true);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <button
      className={`btn-menu gradient-border ${isDisabled ? 'btn-success' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {isDisabled ? 'Saída Já Registrada' : 'Registar Saída'}
    </button>
  );
};

export default LeaveButton;