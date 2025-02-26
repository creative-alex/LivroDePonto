import React from 'react';

const ShowEmployees = ({ onClick }) => {
  return (
    <button class="show-user" onClick={onClick}>
      Colaboradores 
    </button>
  );
};

export default ShowEmployees;