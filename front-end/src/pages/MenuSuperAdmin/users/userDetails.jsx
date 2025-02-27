import React, { useState, useEffect } from 'react';
import EditButton from '../buttons/editEntityButton';
import ShowTimeLine from '../buttons/showTimelineButton';
import TimeLine from './timeline';

const UserDetails = ({ userName }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    if (!userName) {
      console.log("❌ Nenhum userName fornecido, abortando requisição!");
      return;
    }

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
          throw new Error(errorMessage || "Erro ao buscar dados do usuário");
        }

        const data = await response.json();
        setUserDetails(data);
        setEditedData(data);
      } catch (err) {
        console.log("🚨 Erro capturado:", err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userName]);

  const handleShowTimeLine = () => {
    setShowMonths(true); // Exibe os botões dos meses quando clicar no botão ShowTimeLine
  };

  const handleSelectMonth = (month) => {
    setSelectedMonth(month); // Define o mês selecionado para buscar os dados corretos
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

  const handleSubmitClick = async () => {
    try {
      const response = await fetch("http://localhost:4005/users/updateUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) throw new Error("Erro ao atualizar usuário");

      const updatedData = await response.json();
      setIsEditing(false);
      setUserDetails(updatedData);
    } catch (err) {
      console.error("Error updating user data:", err.message);
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error.message}</p>;

  return (
    <div className='flex'>
      <h2>User Details</h2>
      {isEditing ? (
        <div>
          <p>
            <strong>Email:</strong> <input type="text" name="email" value={editedData?.email || ""} onChange={handleInputChange} />
          </p>
          <p>
            <strong>Entidade:</strong> <input type="text" name="entidade" value={editedData?.entidade || ""} onChange={handleInputChange} />
          </p>
          <p>
            <strong>Nome:</strong> <input type="text" name="nome" value={editedData?.nome || ""} onChange={handleInputChange} />
          </p>
          <p>
            <strong>Role:</strong> <input type="text" name="role" value={editedData?.role || ""} onChange={handleInputChange} />
          </p>
          <button onClick={handleSubmitClick}>Submeter</button>
          <button onClick={handleCancelClick}>Cancelar</button>
        </div>
      ) : (
        <div>
          <ul>
            <li><strong>Email:</strong> {userDetails.email || "N/A"}</li>
            <li><strong>Entidade:</strong> {userDetails.entidade || "N/A"}</li>
            <li><strong>Nome:</strong> {userDetails.nome || "N/A"}</li>
            <li><strong>Role:</strong> {userDetails.role.charAt(0).toUpperCase() + userDetails.role.slice(1)}</li>
          </ul>
          <div class="details-buttons">
          <EditButton onClick={handleEditClick} />
          <ShowTimeLine onClick={handleShowTimeLine} />
          </div>

          {showMonths && (
            <div>
              <h3>Selecione um mês:</h3>
              <div className="months-container">
                {[
                  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                ].map((month, index) => (
                  <button key={index} onClick={() => handleSelectMonth(index + 1)}>
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedMonth && (
            <TimeLine username={userName} month={selectedMonth}  />
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetails;
