import React, { useState, useEffect } from "react";
import UserDetails from "./userDetails";

const UserList = ({ entityName }) => {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState(null);

  const fetchEmployees = async () => {
    console.log("Botão clicado! Fazendo requisição...");
    try {
      const response = await fetch("http://localhost:4005/users/byEntity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entidadeNome: entityName }),
      });

      if (!response.ok) throw new Error("Erro ao buscar colaboradores");

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err.message);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (entityName) {
      fetchEmployees();
      const interval = setInterval(fetchEmployees, 1000); 
      return () => clearInterval(interval);
    }
  }, [entityName]);

  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error}</p>;

  return (
    <div className="employees-list">
      <h2>Colaboradores </h2>
      {employees.length > 0 ? (
        <ul>
          {employees.map((employee) => (
            <li key={employee.uid} onClick={() => setSelectedUserName(employee.nome)}>
              {employee.nome} - {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum colaborador encontrado.</p>
      )}
      {selectedUserName && <UserDetails userName={selectedUserName} />}
    </div>
  );
};

export default UserList;