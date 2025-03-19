import React from 'react';

const EditButton = ({ onClick }) => {
  return (
    <button className="edit" onClick={onClick}>
      Editar
    </button>
  );
};

export default EditButton;