import React from 'react';
import { useNavigate } from 'react-router-dom';
import Exit from "../../assets/exit.png";

const LogoutButton = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onLogout();
    navigate('/'); // Redireciona para a página inicial
  };

  return (
    <button className=" logout gradient-border" onClick={handleClick}>
      <img src={Exit} alt="Logout" className="logout-icon" />
    </button>
  );
};

export default LogoutButton;
