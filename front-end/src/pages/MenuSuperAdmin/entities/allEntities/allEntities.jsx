import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Agora o useParams está importado corretamente
import Entity from "../entity";

// Resto do código...


// Função para buscar as entidades
const fetchEntities = async (setEntities, setEntityCount, setError) => {
  try {
    const response = await fetch("http://localhost:4005/entity/showEntities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Erro ao buscar entidades");

    const data = await response.json();
    console.log(data, "entities");

    if (typeof data === "object" && !Array.isArray(data)) {
      setEntities(Object.values(data.entityNames));
      setEntityCount(data.entityCount);
    } else if (Array.isArray(data)) {
      setEntities(data);
      setEntityCount(data.length);
    } else {
      throw new Error("Os dados recebidos não têm um formato válido.");
    }
  } catch (err) {
    setError(err.message);
  }
};

// Componente de detalhe da entidade
const EntityDetail = () => {
  const { entityName } = useParams(); 
  return <Entity entityName={entityName} />;
};

const AllEntities = () => {
  const [entities, setEntities] = useState([]);
  const [entityCount, setEntityCount] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchEntities(setEntities, setEntityCount, setError);
  }, []);

  const handleItemClick = (entity) => {
    navigate(`/entidades/${entity.replace(/\s+/g, "-")}`); // Navegação programática
  };

  if (error) return <p>Erro: {error}</p>;
  if (entities.length === 0) return <p>Nenhuma entidade encontrada.</p>;

  return (
    <div className="form-container gradient-border center">
      <h2 className="login-header">Lista de Entidades - {entityCount}</h2>
      <ul className="entity-card">
        {entities.map((entity, index) => (
          <li
            key={index}
            className="list-item"
            onClick={() => handleItemClick(entity)} // Chama a função ao clicar no <li>
          >
            {entity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export { AllEntities, EntityDetail };
