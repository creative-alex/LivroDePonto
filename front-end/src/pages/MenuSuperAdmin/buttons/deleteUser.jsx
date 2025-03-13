import React from 'react';

const DeleteButton = ({ onClick }) => {
  return (
    <button class="del" onClick={onClick}>
      Eliminar
    </button>
  );
};

export default DeleteButton;