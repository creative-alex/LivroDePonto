import React from 'react';

const EditButton = ({ onClick }) => {
  return (
    <a 
      onClick={onClick} 
      style={{ marginBottom: "20px", cursor: "pointer", textDecoration: "none" }}
    >
      Editar
    </a>
  );
};

export default EditButton;