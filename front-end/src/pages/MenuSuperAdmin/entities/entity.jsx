import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import EditButton from "../buttons/editEntityButton";
import UserList from "../users/userList"; 
import capa from "../../../assets/capa.jpg";
import LogoutButton from "../../../components/LogoutButton/logoutButton";

const normalizeName = (name) => {
  return name
    .trim()
    .replace(/\s+/g, "-") // Substitui espaços por "-"
    .replace(/[^a-zA-Z0-9-]/g, ""); // Remove caracteres inválidos
};

const handleLogout = () => {
  localStorage.removeItem("user");
};

const Entity = () => {
  const { entityName } = useParams();
  const formattedEntityName = decodeURIComponent(entityName).replace(/%20/g, "-"); // Substitui "%20" por "-"
  const navigate = useNavigate();

  const [currentEntityName, setCurrentEntityName] = useState(formattedEntityName);
  const [entityData, setEntityData] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        const response = await fetch("https://api-ls3q.onrender.com/entity/entityDetails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: normalizeName(currentEntityName) }),
        });

        if (!response.ok) throw new Error("Erro ao buscar detalhes da entidade");

        const data = await response.json();
        setEntityData(data);
        setEditedData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (currentEntityName) {
      fetchEntityData();
    }
  }, [currentEntityName]);

  const handleEditClick = () => setIsEditing(true);
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedData(entityData);
  };
  const handleInputChange = (e) => setEditedData({ ...editedData, [e.target.name]: e.target.value });

  const handleSubmitClick = async () => {
    try {
      const response = await fetch("https://api-ls3q.onrender.com/entity/updateEntity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: entityData.nome, ...editedData }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar a entidade");

      const newEntityName = normalizeName(editedData.nome); // Nome atualizado normalizado
      setEntityData({ ...entityData, ...editedData }); // Atualiza o estado com os dados editados
      setIsEditing(false);
      setCurrentEntityName(newEntityName); // Atualiza o nome atual da entidade
      navigate(`/entidades/${newEntityName}`); // Redireciona para a nova rota
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error}</p>;
  if (!entityData) return <p>Carregando...</p>;

  return (
    <>
      <div style={{ width: '30vw' }}>
        <div className="cut">
            <img src={capa} alt="Capa" className="capa cut" />
        </div>
            <LogoutButton onLogout={handleLogout} />
      </div>
      <div className="nav-container">
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
    <div className="gradient-border">
      {isEditing ? (
        <div className="ent-info">
          <p><strong>Nome:</strong> <input className="min-input" type="text" name="nome" value={editedData?.nome || ""} onChange={handleInputChange} /></p>
          <p><strong>NIF:</strong> <input className="min-input" type="text" name="nif" value={editedData?.nif || ""} onChange={handleInputChange} /></p>
          <p><strong>Morada:</strong> <input className="min-input" type="text" name="morada" value={editedData?.morada || ""} onChange={handleInputChange} /></p>
          <div className="button-container">
            <button className="btn" onClick={handleSubmitClick}>Submeter</button>
            <button className="btn" onClick={handleCancelClick}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="ent-info">
          <p><strong>Nome:</strong> {entityData.nome}</p>
          <p><strong>NIF:</strong> {entityData.nif}</p>
          <p><strong>Morada:</strong> {entityData.morada}</p>
          <p><strong>Número de Colaboradores:</strong> {entityData.userCount}</p>
          <EditButton onClick={handleEditClick} />          
        </div>
      )}
      {/* Renderiza a lista de usuários */}
      <UserList entityName={normalizeName(entityData.nome)} setSelectedUser={(user) => navigate(`/${normalizeName(entityData.nome)}/${normalizeName(user.nome)}`)} />
    </div>
    </>
  );
};

export default Entity;