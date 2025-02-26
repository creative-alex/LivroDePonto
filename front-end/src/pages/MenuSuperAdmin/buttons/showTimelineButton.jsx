import React from 'react';

const ShowTimeLine = ({ onClick }) => {
  return (
    <button class="show-cron" onClick={onClick}>
      Mostrar Cronograma
    </button>
  );
};

export default ShowTimeLine;