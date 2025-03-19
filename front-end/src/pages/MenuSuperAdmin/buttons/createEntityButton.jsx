import React from 'react';

const CreateButton = ({ onClick }) => {
  return (
    <button className="create-entity" onClick={onClick}>
      Criar Nova Entidade
    </button>
  );
};

export default CreateButton;