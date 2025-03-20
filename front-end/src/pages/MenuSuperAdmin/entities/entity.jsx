import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditButton from "../buttons/editEntityButton";
import ShowEmployeesButton from "../buttons/ShowEmployeesButton";

const normalizeName = (name) => {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");
};

const Entity = () => {
  const { entityName } = useParams();
  const formattedEntityName = decodeURIComponent(entityName);
  const navigate = useNavigate();

  const [currentEntityName, setCurrentEntityName] = useState(formattedEntityName);
  const [entityData, setEntityData] = useState(null);
  const [oldName, setOldName] = useState("");
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);

  useEffect(() => {
    const fetchEntityData = async () => {
      try {
        const response = await fetch("http://localhost:4005/entity/entityDetails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: normalizeName(currentEntityName) }),
        });

        if (!response.ok) throw new Error("Erro ao buscar detalhes da entidade");

        const data = await response.json();
        setEntityData(data);
        setEditedData(data);
        setOldName(data.nome);
      } catch (err) {
        setError(err.message);
      }
    };

    if (currentEntityName) fetchEntityData();
  }, [currentEntityName]);

  const handleEditClick = () => setIsEditing(true);
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedData(entityData);
  };
  const handleInputChange = (e) => setEditedData({ ...editedData, [e.target.name]: e.target.value });

  // Modifique o handleSubmitClick para navegar para a nova URL:
  const handleSubmitClick = async () => {
    try {
      const response = await fetch("http://localhost:4005/entity/updateEntity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, ...editedData }),
      });
  
      if (!response.ok) throw new Error("Erro ao atualizar a entidade");
      
      setIsEditing(false);
      navigate(-1); // <--- APENAS VOLTA NA HISTÓRICO
    } catch (err) {
      setError(err.message);
    }
  };
  
  // REMOVA ESTE USEEFFECT POR COMPLETO (É O CAUSA PRINCIPAL DO PROBLEMA)
  // useEffect(() => {
  //   if (currentEntityName !== formattedEntityName) {
  //     navigate(-1);
  //   }
  // }, [currentEntityName, formattedEntityName, navigate]);

  const handleShowEmployeesClick = () => navigate(`/entidades/${normalizeName(currentEntityName)}/users`);

  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error}</p>;
  if (!entityData) return <p>Carregando...</p>;

  return (
    <div className="form-container gradient-border">
      <h2>Entidade Selecionada</h2>
      {isEditing ? (
        <div className="entidade-info">
          <p><strong>Nome:</strong> <input type="text" name="nome" value={editedData?.nome || ""} onChange={handleInputChange} /></p>
          <p><strong>NIF:</strong> <input type="text" name="nif" value={editedData?.nif || ""} onChange={handleInputChange} /></p>
          <p><strong>Morada:</strong> <input type="text" name="morada" value={editedData?.morada || ""} onChange={handleInputChange} /></p>
          <div className="entidade-botoes">
            <button onClick={handleSubmitClick}>Submeter</button>
            <button className="cancelar" onClick={handleCancelClick}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="entidade-info">
          <p><strong>Nome:</strong> {entityData.nome}</p>
          <p><strong>NIF:</strong> {entityData.nif}</p>
          <p><strong>Morada:</strong> {entityData.morada}</p>
          <p><strong>Número de Colaboradores:</strong> {entityData.userCount}</p>
          <div className="entidade-botoes">
            <EditButton onClick={handleEditClick} />
            <ShowEmployeesButton onClick={handleShowEmployeesClick} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Entity;