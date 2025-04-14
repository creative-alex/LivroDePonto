import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from "react-router-dom"; // Importar Link e useLocation
import EditButton from '../buttons/editEntityButton';
import ShowTimeLine from '../buttons/showTimelineButton';
import TimeLine from './timeline';
import EntidadeSelect from '../combobox/allEntitiesSelect';
import DeleteUser from '../buttons/deleteUser';


const UserDetails = ({ selectedUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  const navigate = useNavigate(); // Obtém a função navigate
  const location = useLocation(); // Obter a localização atual

  // Dividir o caminho em segmentos
  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment); // Remove segmentos vazios

  // Pega o uid do selectedUser, se não existir, pega do localStorage
  const userName = selectedUser?.uid || localStorage.getItem("selectedUserUID");

  // Guarda o uid no localStorage quando selectedUser mudar
  useEffect(() => {
    if (selectedUser?.uid) {
      localStorage.setItem("selectedUserUID", selectedUser.uid);
    }
  }, [selectedUser]);


  useEffect(() => {
    if (!userName) {
      console.log("❌ Nenhum userName fornecido, abortando requisição!");
      return;
    }
  
    // 🔴 Resetando os estados ao mudar de utilizador
    setShowMonths(false);
    setSelectedMonth(null);
  
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const response = await fetch(`http://localhost:4005/users/userDetails`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userName }),
        });
  
        if (!response.ok) {
          const errorMessage = await response.text();
          console.log("❌ Erro na resposta:", errorMessage);
          throw new Error(errorMessage || "Erro ao buscar dados do user");
        }
  
        const data = await response.json();

        console.log(response)
        
        setUserDetails(data);
        setEditedData({ ...data, oldNome: data.nome });
  
      } catch (err) {
        console.log("🚨 Erro capturado:", err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserDetails();
  }, [userName ]); 
  

  const handleShowTimeLine = () => {
    setShowMonths(true);
  };

  const handleDeleteClick = async () => {
    const confirmDelete = window.confirm("Tem certeza que deseja apagar este usuário? Esta ação não pode ser desfeita.");
    
    if (!confirmDelete) {
      return; // Se o usuário cancelar, interrompe a execução
    }
  
    try {
      const response = await fetch(`http://localhost:4005/users/deleteUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        console.log("Erro na resposta:", errorMessage);
        throw new Error(errorMessage || "Erro ao apagar user");
      }
  
      navigate(-1); // Volta para a página anterior após eliminar o user
    } catch (err) {
      console.log("Erro ao eliminar user", err);
    }
  };

  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedData(userDetails);
  };

  const handleInputChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleEntidadeChange = (e) => {
    console.log("🚀 Entidade selecionada:", e.target.value);
    setEditedData({ ...editedData, entidade: e.target.value });
  };
  

  const handleSubmitClick = async () => {
    try {
        const response = await fetch("http://localhost:4005/users/updateUserDetails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editedData),
        });

        if (!response.ok) throw new Error("Erro ao atualizar user");

        const updatedData = await response.json();
        setIsEditing(false);
        setUserDetails(updatedData);

        // 🔴 Oculta os detalhes após o submit
        setShowDetails(false);

        // 🔴 Verifica se o nome foi alterado antes de navegar
        if (editedData.nome !== userDetails.nome) {
            navigate(-1); // Volta para a página anterior
        }else {
          window.location.reload(); // Recarrega a página
      }
    } catch (err) {
        console.error("Error updating user data:", err.message);
        setError(err.message);
    }
};
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error.message}</p>;

  if (!showDetails) return null; 

  return (
    <div className='flex'>
      {/* Header dinâmico com links */}
      <header className="dynamic-header flex-center">
        <h3>
          {pathSegments.map((segment, index) => {
            // Construir o caminho acumulado para cada segmento
            const pathToSegment = `/${pathSegments.slice(0, index + 1).join("/")}`;
            return (
              <span key={index}>
                <Link to={pathToSegment} className="breadcrumb-link">
                  {segment}
                </Link>
                {index < pathSegments.length - 1 && " / "}
              </span>
            );
          })}
        </h3>
      </header>

       {isEditing ? (
  <div className="form-container  gradient-border">
    <p className="input-group">
      <strong className="input-label">Nome:</strong>
      <input 
        type="text" 
        name="nome" 
        className="form-input"
        value={editedData?.nome || ""} 
        onChange={handleInputChange} 
      />
    </p>
    <p className="input-group">
      <strong className="input-label">Email:</strong>
      <input 
        className="form-input" 
        type="text" 
        name="email" 
        value={editedData?.email || ""} 
        onChange={handleInputChange} 
      />
    </p>
    <p className="input-group">
      <strong className="input-label">Entidade:</strong> 
    </p>
    <EntidadeSelect 
        className="form-select"
        value={editedData?.entidade || ""} 
        selectedEntity={editedData?.entidade || ""} 
        onChange={handleEntidadeChange} 
    />
    <p className="input-group">
      <strong className="input-label">Função na Empresa:</strong>
      <input 
        className="form-input" 
        type="text" 
        name="role" 
        value={editedData?.role || ""} 
        onChange={handleInputChange} 
      />
    </p>
    <p className="input-group">
      <strong className="input-label">Nova Password Temporária:</strong>
      <input 
        className="form-input" 
        type="password" 
        name="newPassword" 
        minLength="6" 
        value={editedData?.newPassword || ""} 
        onChange={handleInputChange} 
      />
    </p>
    <div className="button-container">
      <button className="btn" onClick={handleSubmitClick}>Submeter</button>
      <button className="btn" onClick={handleCancelClick}>Cancelar</button>
    <DeleteUser  onClick={handleDeleteClick} />   

    </div>
  </div>
) : (
    
  <div className="table-container  gradient-border">
    <ul>
      <li className='list-item'><strong>Nome:</strong> {userDetails.nome || "N/A"}</li>
      <li className='list-item'><strong>Email:</strong> {userDetails.email || "N/A"}</li>
      <li className='list-item'><strong>Entidade:</strong> {userDetails.entidade || "N/A"}</li>
      <li className='list-item'><strong>Função na Empresa:</strong> {userDetails.role}</li>
    </ul>
    <div className="button-container">
      <EditButton onClick={handleEditClick} />
      <ShowTimeLine onClick={handleShowTimeLine} />
    </div>
            

    {showMonths && (
      <div className="button-container flex-center">
        <div className="months-wrapper">
          <h3>Selecione um mês:</h3>
          <div className="months-container">
            {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
              .map((month, index) => (
                <button className="btn" key={index} onClick={() => handleSelectMonth(index + 1)}>
                  {month}
                </button>
              ))}
          </div>
        </div>
      </div>
    )}

    {selectedMonth && <TimeLine username={userName} month={selectedMonth} />}
  </div>
)}

    </div>
  );
  
};

export default UserDetails;
