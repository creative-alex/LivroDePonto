import { useEffect, useState } from "react";

const fetchEntities = async (setEntities, setError) => {
  try {
    const response = await fetch('http://localhost:4005/entity/showEntities', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar entidades");
    }

    const data = await response.json();
    setEntities(data.entityNames); // Acessa a propriedade entityNames
  } catch (err) {
    setError(err.message);
  }
};

const ComboboxAllEntities = ({ className, value, onChange, required }) => {
  const [entities, setEntities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntities(setEntities, setError);
  }, []);

  if (error) return <p>Erro: {error}</p>;
  if (entities.length === 0) return <p>Nenhuma entidade encontrada.</p>;

  return (
    <select className={className} value={value} onChange={onChange} required={required}>
      <option value="">Selecione uma entidade</option>
      {entities.map((name, index) => (
        <option key={index} value={name}>{name}</option>
      ))}
    </select>
  );
};

export default ComboboxAllEntities;