import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const EntryRegister = () => {
  const { userName } = useContext(UserContext);
  const [entryTime, setEntryTime] = useState(sessionStorage.getItem('entryTime') || null);

  const handleEntry = (event) => {
    const value = event.target.value;
    setEntryTime(value);
    sessionStorage.setItem('entryTime', value);

    fetch('http://localhost:4005/users/registerEntry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entryTime: value, userName }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Entrada registrada com sucesso:', data);
    })
    .catch(error => {
      console.error('Erro ao registrar entrada:', error);
    });
  };

  return (
    <div>
      <label htmlFor="entryTime">Hora de Entrada: </label>
      <select id="entryTime" onChange={handleEntry}>
        <option value="">Selecione</option>
        <option value="08:00">08:00</option>
        <option value="09:00">09:00</option>
        <option value="10:00">10:00</option>
        <option value="11:00">11:00</option>
      </select>
      {entryTime && <p>Hora de Entrada: {entryTime}</p>}
    </div>
  );
};

export default EntryRegister;