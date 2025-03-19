import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const UserList = () => {
  const { entityName } = useParams();
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
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
        setError(err.message);
      }
    };

    if (entityName) fetchEmployees();
  }, [entityName]);


  const handleItemClick = (employee) => {
    navigate(`/entidades/${entityName}/users/${encodeURIComponent(employee.nome)}`);
  };

  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error}</p>;

  return (
    <div className="form-container gradient-border">
      <h2 className="login-header">Colaboradores de {entityName}</h2>
      {employees.length > 0 ? (
        <ul className="entity-card">
          {employees.map((employee) => (
            <li key={employee.uid} className="list-item" onClick={() => handleItemClick(employee)}>
              {employee.nome} - {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum colaborador encontrado.</p>
      )}
    </div>
  );
};

export default UserList;