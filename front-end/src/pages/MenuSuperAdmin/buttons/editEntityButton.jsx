import React from 'react';

const EditButton = ({ onClick }) => {
  return (
    <a onClick={onClick}>
      Editar
    </a>
  );
};

export default EditButton;