import React from 'react';

const ShowTimeLine = ({ onClick }) => {
  return (
    <button className="btn" onClick={onClick}>
      Consultar Assiduidade
    </button>
  );
};

export default ShowTimeLine;