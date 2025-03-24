import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onLogout();
    navigate('/'); // Redireciona para a página inicial
  };

  return (
    <button id="logout" onClick={handleClick}>
      Logout
    </button>
  );
};

export default LogoutButton;
