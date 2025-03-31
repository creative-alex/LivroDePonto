import React, { useState, useEffect } from 'react';

const LeaveButton = ({ username }) => {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const checkLeave = async () => {
      try {
        const response = await fetch('http://localhost:4005/users/checkLeave', {
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
      const response = await fetch('http://localhost:4005/users/registerLeave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ time: formattedTime, username })
      });

      if (!response.ok) {
        throw new Error('Erro ao registrar a saída');
      }
      
      console.log('Saída registrada com sucesso!');
      setIsDisabled(true);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <button className="btn-menu gradient-border" onClick={handleClick} disabled={isDisabled}>
      {isDisabled ? 'Saída Já Registrada' : 'Registrar Saída'}
    </button>
  );
};

export default LeaveButton;