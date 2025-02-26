import React, { useEffect, useState } from "react";
import EditButton from "../buttons/editEntityButton";
import ShowEmployeesButton from "../buttons/ShowEmployeesButton";
import UserDetails from "../users/userList";

const Entity = ({ entityName }) => {
  const [entityData, setEntityData] = useState(null);
  const [oldName, setOldName] = useState("");
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [showEmployees, setShowEmployees] = useState(false);

  const fetchEntityData = async () => {
    try {
      const response = await fetch("http://localhost:4005/entity/entityDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entityName }),
      });

      if (!response.ok) throw new Error("Erro ao buscar detalhes da entidade");

      const data = await response.json();
      setEntityData(data);
      setEditedData(data);
      setOldName(data.nome);
    } catch (err) {
      console.error("Error fetching entity data:", err.message);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!entityName) return;
    setShowEmployees(false);
    fetchEntityData();
  }, [entityName]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedData(entityData);
  };

  const handleInputChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleSubmitClick = async () => {
    try {
      const response = await fetch("http://localhost:4005/entity/updateEntity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, ...editedData }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar a entidade");

      const updatedData = await response.json();
      setIsEditing(false);
      setOldName(updatedData.nome);
      await fetchEntityData(); // Recarrega os dados da entidade após a atualização
    } catch (err) {
      console.error("Error updating entity data:", err.message);
      setError(err.message);
    }
  };

  const handleShowEmployeesClick = () => {
    setShowEmployees(true);
  };

  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error}</p>;
  if (!entityData) return <p></p>;

  return (
    <div className="entidade-container">
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
          <p><strong>Numero de Colaboradores:</strong> {entityData.userCount}</p>
          <div className="entidade-botoes">
            <EditButton onClick={handleEditClick} />
            <ShowEmployeesButton onClick={handleShowEmployeesClick} />
          </div>
        </div>
      )}

         {showEmployees && <UserDetails entityName={entityData.nome} userCount={entityData.userCount} />}
    </div>
  );
};

export default Entity;