import React from 'react';

const NewUser = ({ onClick }) => {
  return (
    <button class="new-user" onClick={onClick}>
      Criar Novo User
    </button>
  );
};

export default NewUser;