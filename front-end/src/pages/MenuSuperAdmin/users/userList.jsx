import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";

const UserList = ({ setSelectedUser }) => {
  const { entityName } = useParams();
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    setSelectedUser(employee);
    navigate(`/entidades/${entityName}/users/${encodeURIComponent(employee.nome.replace(/\s+/g, "-"))}`);
  };

  // Dividir o caminho em segmentos para o header dinâmico
  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment); // Remove segmentos vazios

  if (error) return <p style={{ color: "red" }}>⚠ Erro: {error}</p>;

  return (
    <div className="form-container center gradient-border">
      {/* Header dinâmico com links */}
      <header className="dynamic-header">
        <h3>
          {pathSegments.map((segment, index) => {
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
