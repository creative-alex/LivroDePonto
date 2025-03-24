import React from 'react';

const NewUser = ({ onClick }) => {
  return (
    <button  onClick={onClick}>
      Criar Novo User
    </button>
  );
};

export default NewUser;