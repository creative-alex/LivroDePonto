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
    } else if (!localStorage.getItem("selectedUserUID")) {
      console.error("❌ Nenhum userName disponível!");
    }
  }, [selectedUser]);


  useEffect(() => {
    console.log("🔍 userName usado na requisição:", userName);

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
        const response = await fetch(`https://api-ls3q.onrender.com/users/userDetails`, {
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
      const response = await fetch(`https://api-ls3q.onrender.com/users/deleteUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        console.log("Erro na resposta:", errorMessage);
        throw new Error(errorMessage || "Erro ao apagar user");
      }
  
      navigate(-2); 
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

  const normalizeName = (name) => {
    if (!name) return ""; // Retorna uma string vazia se o nome for undefined ou null
    return name
      .trim()
      .replace(/\s+/g, "-") // Substitui espaços por "-"
      .replace(/[^a-zA-Z0-9-]/g, ""); // Remove caracteres inválidos
  };
  

  const handleSubmitClick = async () => {
    try {
      const dataToSend = {
        ...editedData,
        userName: userDetails?.uid || localStorage.getItem("selectedUserUID"),
      };
  
      console.log("🔍 Dados enviados para atualização:", dataToSend);
  
      const response = await fetch("https://api-ls3q.onrender.com/users/updateUserDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
  
      if (!response.ok) throw new Error("Erro ao atualizar user");
  
      const updatedData = await response.json();
      setIsEditing(false);
      setUserDetails(updatedData);
  
      // Atualiza o localStorage com o novo nome do usuário
      localStorage.setItem("selectedUserUID", updatedData.uid);
  
      // Verifica se o nome ou entidade mudou
      if (updatedData.nome !== userDetails.nome || updatedData.entidade !== userDetails.entidade) {
        const normalizedEntityName = normalizeName(updatedData.entidade);
        navigate(`/entidades/${normalizedEntityName}`);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Erro ao atualizar os dados do usuário:", err.message);
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
                <button className="btn-menu gradient-border">Visualizar Entidades & Users </button>
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
                <h2>Horas Totais</h2>
                <p><strong>Horas Normais:</strong> {totais.totalHoras}</p>
                <p><strong>Horas Extra:</strong> {totais.totalExtras}</p>
                <p><strong>Faltas:</strong> {totais.diasFalta}</p>
                <p><strong>Férias:</strong> {totais.diasFerias}</p>
              </div>
            )}

    <div className='ulist'>
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
      <strong className="input-label">Função:</strong>
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
