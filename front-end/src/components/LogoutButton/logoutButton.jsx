import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onLogout();
    navigate('/'); // Redireciona para a página inicial
  };

  return (
    <button className="flex-center button-container logout gradient-border" onClick={handleClick}>
      Logout
    </button>
  );
};

export default LogoutButton;
