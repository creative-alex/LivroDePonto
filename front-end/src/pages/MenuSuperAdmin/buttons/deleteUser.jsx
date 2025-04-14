import React from 'react';

const DeleteButton = ({ onClick }) => {
  return (
    <button className="delete-user btn" onClick={onClick}>
      Eliminar 
    </button>
  );
};

export default DeleteButton;