import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom"; // Adicionei Link para os botões
import Entity from "../entity";
import capa from "../../../../assets/capa.jpg";
import LogoutButton from "../../../../components/LogoutButton/logoutButton";

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

const handleLogout = () => {
  localStorage.removeItem("user");
  setIsLoggedIn(false);
  setIsAdmin(false);
  setIsFirstLogin(false);
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
    <>
    <div style={{ width: '30vw' }}>
      <div className="cut">
          <img src={capa} alt="Capa" className="capa cut" />
      </div>
          <LogoutButton onLogout={handleLogout} />
    </div>
      <div className="flex-center nav-container">
      <Link to="/entidades">
          <button className="btn-menu gradient-border">Entidades & Users </button>
        </Link>
        <Link to="/nova-entidade">
          <button className="btn-menu gradient-border">Criar Entidade</button>
        </Link>
        <Link to="/novo-user">
          <button className="btn-menu gradient-border">Criar User</button>
        </Link>
      </div>

    <div className="elist gradient-border ">
      <h2 className="login-header">{entityCount} - Entidades</h2>
      <ul>
        {entities.map((entity, index) => (
          <li
            key={index}
            className="list-item"
            onClick={() => handleItemClick(entity)} // Chama a função ao clicar no <li>
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} // Estilo para alinhar o texto e o ícone
          >
            {entity}
            <span style={{ marginLeft: "10px", color: "yellow" }}>
              {/* Ícone de seta amarela */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="#C8932F"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 1 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                />
              </svg>
            </span>
          </li>
        ))}
      </ul>
      </div>

      
    </>
  );
};

export { AllEntities, EntityDetail };
