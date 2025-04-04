import React from 'react';

const DeleteButton = ({ onClick }) => {
  return (
    <button className="delete-user" onClick={onClick}>
      Eliminar Colaborador
    </button>
  );
};

export default DeleteButton;