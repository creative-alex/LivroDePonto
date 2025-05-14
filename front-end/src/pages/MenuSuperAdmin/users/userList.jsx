import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom"; // Adicione useNavigate
import { calcularHoras, formatarMinutos } from "./calcHours";
import ExportExcel from "./ExportExcel";
import MultipleExcel from "./MultipleExcel"; // Certifique-se de importar corretamente

const UserList = ({ setSelectedUser }) => {
  const { entityName } = useParams();
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [selecionarMultiplos, setSelecionarMultiplos] = useState(false);
  const [utilizadoresSelecionados, setUtilizadoresSelecionados] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);

  const location = useLocation();
  const navigate = useNavigate(); // Inicialize o useNavigate

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("https://api-ls3q.onrender.com/users/byEntity", {
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

  const handleCheckboxChange = (uid) => {
    setUtilizadoresSelecionados((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const exportarTodos = async () => {
    try {
  
      const usuariosSemRegistros = [];
  
      for (const user of employees) {
        if (utilizadoresSelecionados.includes(user.uid)) {
  
          const response = await fetch("https://api-ls3q.onrender.com/users/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.nome, month: mesSelecionado }),
          });
  
          if (!response.ok) {
            console.error(`Erro ao buscar dados para o usuário ${user.nome}`);
            continue;
          }
  
          const data = await response.json();
          const registos = Array.isArray(data.registros) ? data.registros : [];
  
          if (registos.length === 0) {
            console.warn(`Usuário ${user.nome} não possui registros.`);
            usuariosSemRegistros.push(user.nome);
          }
        }
      }
  
      if (usuariosSemRegistros.length > 0) {
        const confirmar = window.confirm(
          `Os seguintes usuários não possuem registros: ${usuariosSemRegistros.join(
            ", "
          )}. Deseja continuar com a exportação?`
        );
  
        if (!confirmar) {
          return;
        }
      }
  
  
      const dadosPorUsuario = {};
  
      for (const user of employees) {
  
        if (utilizadoresSelecionados.includes(user.uid)) {
  
          // Buscar os registros de entrada e saída do usuário
          const response = await fetch("https://api-ls3q.onrender.com/users/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.nome, month: mesSelecionado }),
          });
  
          if (!response.ok) {
            console.error(`Erro ao buscar dados para o usuário ${user.nome}`);
            continue;
          }
  
  
          const diasNoMes = new Date(new Date().getFullYear(), mesSelecionado, 0).getDate();
  
          let totalMinutos = 0;
          let totalMinutosExtras = 0;
  
          let novosDados = Array.from({ length: diasNoMes }, (_, i) => ({
            dia: `${String(i + 1).padStart(2, "0")}-${String(mesSelecionado).padStart(2, "0")}`,
            horaEntrada: "-",
            horaSaida: "-",
            total: "-",
            extra: "-",
            isFerias: false,
          }));
  
  
          const data = await response.json();
  
          const registos = Array.isArray(data.registros) ? data.registros : [];
          const ferias = Array.isArray(data.ferias) ? data.ferias : [];
  
  
          const hoje = new Date();
  
          novosDados = novosDados.map((item, index) => {
  
            const registo = registos.find((r) => new Date(r.timestamp).getDate() === index + 1);
  
            const dataAtual = new Date(hoje.getFullYear(), mesSelecionado - 1, index + 1);
            const diaSemana = dataAtual.getDay();
            const feriado = false; // Substituir por lógica de feriados, se necessário
            const estaDeFerias = ferias.includes(item.dia);
  
            if (estaDeFerias) {
              return { ...item, horaEntrada: "Férias", horaSaida: "Férias", total: "Férias", extra: "Férias", isFerias: true };
            }
  
            if (registo) {
              const { total, extra, minutos, minutosExtras } = calcularHoras(registo.horaEntrada, registo.horaSaida);
              totalMinutos += minutos;
              totalMinutosExtras += minutosExtras;
              return {
                ...item,
                horaEntrada: registo.horaEntrada || "-",
                horaSaida: registo.horaSaida || "-",
                total,
                extra,
              };
            } else if (!estaDeFerias && dataAtual < hoje && dataAtual.toDateString() !== hoje.toDateString() && diaSemana !== 0 && diaSemana !== 6 && !feriado) {
              return { ...item, horaEntrada: "-", horaSaida: "-", total: "0h 0m", extra: "0h 0m" };
            }
  
            return item;
          });
  
  
          const diasFalta = novosDados.filter((d) => d.total === "0h 0m" && !d.isFerias).length;
          const diasFerias = novosDados.filter((d) => d.isFerias).length;
  
  
          const totais = {
            totalHoras: formatarMinutos(totalMinutos),
            totalExtras: formatarMinutos(totalMinutosExtras),
            diasFalta,
            diasFerias,
          };
  
  
          // Armazena os dados do usuário no objeto
          dadosPorUsuario[user.nome] = { dados: novosDados, totais };
        }
      }
  
      // Envia os dados para o MultipleExcel
      await MultipleExcel({ dadosPorUsuario, month: mesSelecionado });
  
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
    }
  };
  

  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  return (
    <div className="ulist center gradient-border">
      <header className="dynamic-header">
        <h3>
          {location.pathname
            .split("/")
            .filter(Boolean)
            .map((segment, index, arr) => (
              <span key={index}>
                <Link
                  to={`/${arr.slice(0, index + 1).join("/")}`}
                  className="breadcrumb-link"
                >
                  {segment}
                </Link>
                {index < arr.length - 1 && " | "}
              </span>
            ))}
        </h3>
        <button className="exc" onClick={() => setSelecionarMultiplos(!selecionarMultiplos)}>
        {selecionarMultiplos
          ? "Cancelar Seleção Múltipla"
          : "Selecionar Vários"}
      </button>
      </header>

      {selecionarMultiplos && (
        <>
          <div style={{ margin: "1rem 0" }}>
            <button
              onClick={() => {
                if (utilizadoresSelecionados.length === employees.length) {
                  setUtilizadoresSelecionados([]);
                } else {
                  setUtilizadoresSelecionados(employees.map((e) => e.uid));
                }
              }}
            >
              {utilizadoresSelecionados.length === employees.length
                ? "Desmarcar Todos"
                : "Selecionar Todos"}
            </button>
          </div>

          <select
            onChange={(e) => setMesSelecionado(Number(e.target.value))}
            value={mesSelecionado}
          >
            {meses.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button onClick={exportarTodos}>Exportar Selecionados</button>
        </>
      )}

      {employees.length > 0 ? (
        <ul className="entity-card">
          {employees.map((employee) => (
            <li key={employee.uid} className="list-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {selecionarMultiplos ? (
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <input
                    type="checkbox"
                    checked={utilizadoresSelecionados.includes(employee.uid)}
                    onChange={() => handleCheckboxChange(employee.uid)}
                  />
                  {employee.nome}
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
                </label>
              ) : (
                <span
                  onClick={() => {
                    if (setSelectedUser) {
                      setSelectedUser(employee); 
                      localStorage.setItem("selectedUserUID", employee.uid); 
                      navigate(`/user-details/${employee.uid}`); 
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
                >
                  {employee.nome}
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
                </span>
              )}
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
