import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const ExitRegister = () => {
  const { userName } = useContext(UserContext);
  const [exitTime, setExitTime] = useState(sessionStorage.getItem('exitTime') || null);

  const handleExit = (event) => {
    const value = event.target.value;
    setExitTime(value);
    sessionStorage.setItem('exitTime', value);

    fetch('http://localhost:4005/users/registerLeave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exitTime: value, userName }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Saída registrada com sucesso:', data);
    })
    .catch(error => {
      console.error('Erro ao registrar saída:', error);
    });
  };

  return (
    <div>
      <label htmlFor="exitTime">Hora de Saída: </label>
      <select id="exitTime" onChange={handleExit}>
        <option value="">Selecione</option>
        <option value="17:00">17:00</option>
        <option value="18:00">18:00</option>
        <option value="19:00">19:00</option>
        <option value="20:00">20:00</option>
      </select>
      {exitTime && <p>Hora de Saída: {exitTime}</p>}
    </div>
  );
};

export default ExitRegister;