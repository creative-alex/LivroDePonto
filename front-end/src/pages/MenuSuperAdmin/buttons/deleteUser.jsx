import React from 'react';

const DeleteButton = ({ onClick }) => {
  return (
    <button className="del" onClick={onClick}>
      Eliminar
    </button>
  );
};

export default DeleteButton;