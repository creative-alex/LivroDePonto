import React from 'react';

const EditButton = ({ onClick }) => {
  return (
    <button class="edit" onClick={onClick}>
      Editar
    </button>
  );
};

export default EditButton;