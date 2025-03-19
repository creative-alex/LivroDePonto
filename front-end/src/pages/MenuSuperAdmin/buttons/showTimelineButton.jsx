import React from 'react';

const ShowTimeLine = ({ onClick }) => {
  return (
    <button className="show-cron" onClick={onClick}>
      Consultar Assiduidade
    </button>
  );
};

export default ShowTimeLine;