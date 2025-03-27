import React from 'react';

const EditButton = ({ onClick }) => {
  return (
    <button className="btn" onClick={onClick}>
      Editar
    </button>
  );
};

export default EditButton;