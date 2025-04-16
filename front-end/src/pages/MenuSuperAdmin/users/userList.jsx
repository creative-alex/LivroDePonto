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

  const handleCheckboxChange = (uid) => {
    setUtilizadoresSelecionados((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const exportarTodos = async () => {
    try {
      console.log("Iniciando verificação de registros...");
  
      const usuariosSemRegistros = [];
  
      for (const user of employees) {
        if (utilizadoresSelecionados.includes(user.uid)) {
          console.log(`Verificando registros para o usuário: ${user.nome}`);
  
          const response = await fetch("http://localhost:4005/users/calendar", {
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
          console.log("Exportação cancelada pelo administrador.");
          return;
        }
      }
  
      console.log("Iniciando exportação...");
  
      const dadosPorUsuario = {};
      console.log("Inicializando objeto de dados por usuário:", dadosPorUsuario);
  
      for (const user of employees) {
        console.log(`Processando usuário: ${user.nome}`);
  
        if (utilizadoresSelecionados.includes(user.uid)) {
          console.log(`Usuário ${user.nome} selecionado para exportação.`);
  
          // Buscar os registros de entrada e saída do usuário
          const response = await fetch("http://localhost:4005/users/calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.nome, month: mesSelecionado }),
          });
  
          if (!response.ok) {
            console.error(`Erro ao buscar dados para o usuário ${user.nome}`);
            continue;
          }
  
          console.log(`Dados recebidos com sucesso para o usuário ${user.nome}.`);
  
          const diasNoMes = new Date(new Date().getFullYear(), mesSelecionado, 0).getDate();
          console.log(`Número de dias no mês selecionado (${mesSelecionado}): ${diasNoMes}`);
  
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
  
          console.log("Dados iniciais criados para todos os dias do mês:", novosDados);
  
          const data = await response.json();
          console.log("Resposta da API processada:", data);
  
          const registos = Array.isArray(data.registros) ? data.registros : [];
          const ferias = Array.isArray(data.ferias) ? data.ferias : [];
  
          console.log(`Registros encontrados: ${registos.length}`);
          console.log(`Férias encontradas: ${ferias.length}`);
  
          const hoje = new Date();
          console.log("Data atual:", hoje);
  
          novosDados = novosDados.map((item, index) => {
            console.log(`Processando dados do dia ${index + 1}`);
  
            const registo = registos.find((r) => new Date(r.timestamp).getDate() === index + 1);
            console.log(`Registro encontrado para o dia ${index + 1}:`, registo);
  
            const dataAtual = new Date(hoje.getFullYear(), mesSelecionado - 1, index + 1);
            const diaSemana = dataAtual.getDay();
            const feriado = false; // Substituir por lógica de feriados, se necessário
            const estaDeFerias = ferias.includes(item.dia);
            console.log(`Dia da semana: ${diaSemana}, Feriado: ${feriado}, Está de férias: ${estaDeFerias}`);
  
            if (estaDeFerias) {
              console.log(`Usuário ${user.nome} está de férias no dia ${item.dia}`);
              return { ...item, horaEntrada: "Férias", horaSaida: "Férias", total: "Férias", extra: "Férias", isFerias: true };
            }
  
            if (registo) {
              const { total, extra, minutos, minutosExtras } = calcularHoras(registo.horaEntrada, registo.horaSaida);
              totalMinutos += minutos;
              totalMinutosExtras += minutosExtras;
              console.log(`Horas calculadas para o dia ${item.dia}: Total: ${total}, Extra: ${extra}`);
              return {
                ...item,
                horaEntrada: registo.horaEntrada || "-",
                horaSaida: registo.horaSaida || "-",
                total,
                extra,
              };
            } else if (!estaDeFerias && dataAtual < hoje && dataAtual.toDateString() !== hoje.toDateString() && diaSemana !== 0 && diaSemana !== 6 && !feriado) {
              console.log(`Dia ${item.dia} não possui registro e não é fim de semana ou feriado.`);
              return { ...item, horaEntrada: "-", horaSaida: "-", total: "0h 0m", extra: "0h 0m" };
            }
  
            return item;
          });
  
          console.log("Novos dados para o usuário:", novosDados);
  
          const diasFalta = novosDados.filter((d) => d.total === "0h 0m" && !d.isFerias).length;
          const diasFerias = novosDados.filter((d) => d.isFerias).length;
  
          console.log(`Dias em falta: ${diasFalta}`);
          console.log(`Dias de férias: ${diasFerias}`);
  
          const totais = {
            totalHoras: formatarMinutos(totalMinutos),
            totalExtras: formatarMinutos(totalMinutosExtras),
            diasFalta,
            diasFerias,
          };
  
          console.log("Totais calculados:", totais);
  
          // Armazena os dados do usuário no objeto
          dadosPorUsuario[user.nome] = { dados: novosDados, totais };
          console.log(`Dados do usuário ${user.nome} armazenados:`, dadosPorUsuario[user.nome]);
        }
      }
  
      // Envia os dados para o MultipleExcel
      await MultipleExcel({ dadosPorUsuario, month: mesSelecionado });
      console.log("Exportação concluída!");
  
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
    <div className="form-container center gradient-border">
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
                {index < arr.length - 1 && " / "}
              </span>
            ))}
        </h3>
      </header>

      <h2 className="login-header">Colaboradores de {entityName}</h2>

      <button onClick={() => setSelecionarMultiplos(!selecionarMultiplos)}>
        {selecionarMultiplos
          ? "Cancelar Seleção Múltipla"
          : "Selecionar Vários"}
      </button>

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
            <li key={employee.uid} className="list-item">
              {selecionarMultiplos ? (
                <label>
                  <input
                    type="checkbox"
                    checked={utilizadoresSelecionados.includes(employee.uid)}
                    onChange={() => handleCheckboxChange(employee.uid)}
                  />
                  {employee.nome} - {employee.role}
                </label>
              ) : (
                <span
                  onClick={() => {
                    setSelectedUser(employee);
                    navigate(
                      `/entidades/${entityName}/users/${employee.nome}`
                    ); // Redireciona para a página do colaborador
                  }}
                  style={{ cursor: "pointer", color: "blue" }}
                >
                  {employee.nome} - {employee.role}
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
