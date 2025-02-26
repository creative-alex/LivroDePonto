import React from 'react';

const LogoutButton = ({ onClick }) => {
  return (
    <button id="logout" onClick={onClick}>
      Logout
    </button>
  );
};

export default LogoutButton;
