import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from "react-router-dom"; // Importar Link e useLocation
import EditButton from '../buttons/editEntityButton';
import ShowTimeLine from '../buttons/showTimelineButton';
import TimeLine from './timeline';
import EntidadeSelect from '../combobox/allEntitiesSelect';
import DeleteUser from '../buttons/deleteUser';
import capa from '../../../assets/capa.jpg';
import LogoutButton from '../../../components/LogoutButton/logoutButton';


const UserDetails = ({ selectedUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  const [totais, setTotais] = useState(null);
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

const handleLogout = () => {
  localStorage.removeItem("user");
};

const handleTotaisChange = (novosTotais) => {
  setTotais(novosTotais);
};
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error.message}</p>;

  if (!showDetails) return null; 

  return (
    <>
    <div style={{ width: '30vw' }}>
      <div className="cut">
          <img src={capa} alt="Capa" className="capa cut" />
      </div>
          <LogoutButton onLogout={handleLogout} />
      </div>
        <div className=" nav-container">
            <Link to="/entidades">
                <button className="btn-menu gradient-border">Entidades & Users </button>
              </Link>
              <Link to="/nova-entidade">
                <button className="btn-menu gradient-border">Criar Entidade</button>
              </Link>
              <Link to="/novo-user">
                <button className="btn-menu gradient-border">Criar User</button>
              </Link>
        </div>

            {totais && (
              <div className="ent-info">
                <h2>Totais</h2>
                <p><strong>Horas Normais Mensais:</strong> {totais.totalHoras}</p>
                <p><strong>Horas Extras Mensais:</strong> {totais.totalExtras}</p>
                <p><strong>Dias de Falta:</strong> {totais.diasFalta}</p>
                <p><strong>Dias de Férias:</strong> {totais.diasFerias}</p>
              </div>
            )}

    <div className='ulist'>
      {/* Header dinâmico com links */}
      <header className="dynamic-header ">
        <h3>
          <Link to="/entidades" className="breadcrumb-link">Entidades</Link> |{" "}
          <Link to={`/entidades/${userDetails?.entidade}`} className="breadcrumb-link">
            {userDetails?.entidade || "N/A"}
          </Link> |{" "}
          <span>{userDetails?.nome || "N/A"}</span>
        </h3>
        <EditButton onClick={handleEditClick} />
      </header>

       {isEditing ? (
  <div className=" gradient-border">
    <p className="input-group">
      <strong className="input-label">Nome:</strong>
      <input 
        type="text" 
        name="nome" 
        className="min-input"
        value={editedData?.nome || ""} 
        onChange={handleInputChange} 
      />
    </p>
    <p className="input-group">
      <strong className="input-label">Email:</strong>
      <input 
        className="min-input" 
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
        className="min-input" 
        type="text" 
        name="role" 
        value={editedData?.role || ""} 
        onChange={handleInputChange} 
      />
    </p>
    <p className="input-group">
      <strong className="input-label">Nova Password Temporária:</strong>
      <input 
        className="min-input" 
        type="password" 
        name="newPassword" 
        minLength="6" 
        value={editedData?.newPassword || ""} 
        onChange={handleInputChange} 
      />
    </p>
    <div >
      <button className="btn" onClick={handleSubmitClick}>Submeter</button>
      <button className="btn" onClick={handleCancelClick}>Cancelar</button>
    <DeleteUser  onClick={handleDeleteClick} />   

    </div>
  </div>
) : (
    
  <div className="gradient-border">
    <ul>
      <li className='list-item'><strong>Nome:</strong> {userDetails.nome || "N/A"}</li>
      <li className='list-item'><strong>Email:</strong> {userDetails.email || "N/A"}</li>
      <li className='list-item'><strong>Entidade:</strong> {userDetails.entidade || "N/A"}</li>
      <li className='list-item'><strong>Função na Empresa:</strong> {userDetails.role}</li>
    </ul>

  <div className="months-container">
  <header className="mini-header">
    <h2 >Consultar assiduidade</h2>
    <a>Selecione um mês</a>
  </header>

  <div className="relative">
    <select
      className="form-select appearance-none w-full px-3 py-2 border border-gray-200 rounded-md text-gray-800 font-medium focus:outline-none"
      onChange={(e) => handleSelectMonth(parseInt(e.target.value, 10))}
      value={selectedMonth || ""}
    >
      <option value="" disabled>-- Selecione um Mês --</option>
      {[
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ].map((month, index) => (
        <option key={index} value={index + 1}>{month}</option>
      ))}
    </select>
  </div>
</div>

    {selectedMonth && <TimeLine username={userName} month={selectedMonth} onTotaisChange={handleTotaisChange} />}
  </div>
)}

    </div>
    </>
  );
};

export default UserDetails;
