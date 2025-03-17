import { useEffect, useState } from "react";
import Entity from "../entity"; 

const fetchEntities = async (setEntities, setEntityCount, setError) => {
  try {
    const response = await fetch("http://localhost:4005/entity/showEntities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar entidades");
    }

    const data = await response.json();

    console.log(data, "entities")

    // Se for um objeto, converte para array
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

const AllEntities = () => {
  const [entities, setEntities] = useState([]);
  const [entityCount, setEntityCount] = useState(0);
  const [error, setError] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  useEffect(() => {
    fetchEntities(setEntities, setEntityCount, setError);
  }, []);

  if (error) return <p>Erro: {error}</p>;
  if (entities.length === 0) return <p>Nenhuma entidade encontrada.</p>;

  return (
    <div class="entity-list">
      <h2>Lista de Entidades - {entityCount}</h2>
      <ul>
        {entities.map((entity, index) => (
          <li
            key={index}
            onClick={() => setSelectedEntity(entity)}
          >
            {entity ? entity : "Nome desconhecido"}
          </li>
        ))}
      </ul>

      {/* Renderiza o componente Entity apenas se houver uma entidade selecionada */}
      {selectedEntity && (
        <>
          <Entity entityName={selectedEntity} />
        </>
      )}
    </div>
  );
};

export default AllEntities;