import React from 'react';

const ShowEmployees = ({ onClick }) => {
  return (
    <button className="show-user" onClick={onClick}>
      Colaboradores 
    </button>
  );
};

export default ShowEmployees;