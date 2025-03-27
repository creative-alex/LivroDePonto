import React from 'react';

const DeleteButton = ({ onClick }) => {
  return (
    <button className="btn" onClick={onClick}>
      Eliminar Colaborador
    </button>
  );
};

export default DeleteButton;