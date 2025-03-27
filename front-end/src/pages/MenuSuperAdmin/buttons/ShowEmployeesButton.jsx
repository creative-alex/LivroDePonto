import React from 'react';

const ShowEmployees = ({ onClick }) => {
  return (
    <button className="btn" onClick={onClick}>
      Colaboradores 
    </button>
  );
};

export default ShowEmployees;