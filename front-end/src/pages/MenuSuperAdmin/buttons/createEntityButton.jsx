import React from 'react';

const CreateButton = ({ onClick }) => {
  return (
    <button class="create-entity" onClick={onClick}>
      Criar Nova Entidade
    </button>
  );
};

export default CreateButton;