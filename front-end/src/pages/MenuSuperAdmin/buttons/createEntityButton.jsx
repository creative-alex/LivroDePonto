import React from 'react';

const CreateButton = ({ onClick }) => {
  return (
    <button  onClick={onClick}>
      Criar Nova Entidade
    </button>
  );
};

export default CreateButton;