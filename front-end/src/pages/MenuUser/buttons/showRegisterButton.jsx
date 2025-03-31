// src/pages/MenuUser/buttons/showRegisterButton.js
import React from 'react';

const ShowRegister = ({ onClick }) => {

  return (
    <>
      <button className="btn-menu gradient-border" onClick={onClick}>Mostrar Registos</button>
    </>
  );
};

export default ShowRegister;
