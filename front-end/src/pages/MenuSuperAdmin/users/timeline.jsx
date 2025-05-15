import { useState, useEffect } from "react";
import ExportExcel from "./ExportExcel";
import { calcularHoras, formatarMinutos } from "../../../components/Hours/calcHours";
import RegisterVacation from "../buttons/registerVacationButton";
import DeleteRegister from "../buttons/deleteRegisterButton";
import MedicalLeave from "../buttons/medicalLeaveButton";

const feriadosPorto = [
  "01-01", "25-04", "01-05", "10-06", "15-08", "05-10", "01-11", "01-12", "08-12", "25-12"
];


const TableHours = ({ username, month, onTotaisChange, onDadosChange }) => {
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState({
    totalHoras: "0h 0m",
    totalExtras: "0h 0m",
    diasFalta: 0,
    diasFerias: 0,
    diasBaixaMedica: 0,
  });
  const [editando, setEditando] = useState(null);
  const [novoValor, setNovoValor] = useState("");
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    if (!username || !month) return;

    fetchData();
  }, [username, month]);
  

  const cleanUsername = (username) =>
  username.startsWith("user_") ? username.slice(5) : username;

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8080/users/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername(username), month }),
      });

      const diasNoMes = new Date(new Date().getFullYear(), month, 0).getDate();
      let totalMinutos = 0;
      let totalMinutosExtras = 0;

      let novosDados = Array.from({ length: diasNoMes }, (_, i) => ({
        dia: `${String(i + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`,
        horaEntrada: "-",
        horaSaida: "-",
        total: "-",
        extra: "-",
        isFerias: false,
        isBaixaMedica: false,
      }));

      const data = response.ok ? await response.json() : { registros: [], ferias: [], baixas: [] };
      console.log("Data fetched:", data);
      const registros = Array.isArray(data.registros) ? data.registros : [];
      const ferias = Array.isArray(data.ferias)
        ? data.ferias.map(dateStr => {
            // Aceita "DD-MM-YYYY" ou "YYYY-MM-DD"
            if (dateStr.length === 10 && dateStr[2] === "-") {
              // "DD-MM-YYYY" → "DD-MM"
              return dateStr.slice(0, 5);
            }
            if (dateStr.length === 10 && dateStr[4] === "-") {
              // "YYYY-MM-DD" → "DD-MM"
              return dateStr.slice(8, 10) + "-" + dateStr.slice(5, 7);
            }
            return dateStr;
          })
        : [];
      console.log("Ferias:", ferias);
      const baixas = Array.isArray(data.baixas)
        ? data.baixas.map(dateStr => {
            // Aceita "DD-MM-YYYY" ou "YYYY-MM-DD"
            if (dateStr.length === 10 && dateStr[2] === "-") {
              // "DD-MM-YYYY" → "DD-MM"
              return dateStr.slice(0, 5);
            }
            if (dateStr.length === 10 && dateStr[4] === "-") {
              // "YYYY-MM-DD" → "DD-MM"
              return dateStr.slice(8, 10) + "-" + dateStr.slice(5, 7);
            }
            return dateStr;
          })
        : [];

      const hoje = new Date();      
      novosDados = novosDados.map((item, index) => {
        const registo = registros.find((r) => {
          const registoData = new Date(r.timestamp);
          return registoData.getDate() === index + 1 && registoData.getMonth() + 1 === month;
        });
      
        const dataAtual = new Date(hoje.getFullYear(), month - 1, index + 1);
        const diaSemana = dataAtual.getDay();
        const feriado = feriadosPorto.includes(item.dia);
        const estaDeFerias = ferias.includes(item.dia);
        const estaDeBaixaMedica = baixas.includes(item.dia);
      
        // Priorizar status de "Férias" ou "Baixa Médica"
        if (estaDeFerias) {
          return {
            ...item,
            horaEntrada: "Férias",
            horaSaida: "Férias",
            total: "Férias",
            extra: "Férias",
            isFerias: true,
          };
        }
      
        if (estaDeBaixaMedica) {
          return {
            ...item,
            horaEntrada: "Baixa Médica",
            horaSaida: "Baixa Médica",
            total: "Baixa Médica",
            extra: "Baixa Médica",
            isBaixaMedica: true,
          };
        }
      
        // Caso exista um registro, exibir os dados do registro
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
        }
      
        // Caso não seja feriado, férias ou baixa médica, exibir como falta
        if (
          !estaDeFerias &&
          !estaDeBaixaMedica &&
          dataAtual < hoje &&
          dataAtual.toDateString() !== hoje.toDateString() &&
          diaSemana !== 0 &&
          diaSemana !== 6 &&
          !feriado
        ) {
          return { ...item, horaEntrada: "-", horaSaida: "-", total: "0h 0m", extra: "0h 0m" };
        }
      
        return item;
      });

      const diasFalta = novosDados.filter((d) => d.total === "0h 0m" && !d.isFerias && !d.isBaixaMedica).length;
      const diasFerias = novosDados.filter((d) => d.isFerias).length;
      const diasBaixaMedica = novosDados.filter((d) => d.isBaixaMedica).length;

      const novosTotais = {
        totalHoras: formatarMinutos(totalMinutos),
        totalExtras: formatarMinutos(totalMinutosExtras),
        diasFalta,
        diasFerias,
        diasBaixaMedica,
      };

      setTotais(novosTotais);
      setDados(novosDados);

      if (onTotaisChange) {
        onTotaisChange(novosTotais);
      }
      if (onDadosChange) {
        onDadosChange(novosDados);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar horários:", error);
      setTotais({
        totalHoras: "0h 0m",
        totalExtras: "0h 0m",
        diasFalta: 0,
        diasFerias: 0,
        diasBaixaMedica: 0,
      });
    }
  };

  const ativarEdicao = (index, campo, valorAtual) => {
    setEditando({ index, campo });
    setNovoValor(valorAtual === "-" ? "" : valorAtual);
  };
  const salvarEdicao = async (index) => {
    if (!novoValor) return;

    const novoDados = [...dados];
    novoDados[index][editando.campo] = novoValor;
    setDados(novoDados);

    try {
      const response = await fetch("https://api-ls3q.onrender.com/users/update-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername(username),
          date: novoDados[index].dia,
          campo: editando.campo,
          valor: novoValor
        }),
      });


      // Recarregar os dados após salvar a edição
      await fetchData();
    } catch (error) {
      console.error("❌ Erro ao atualizar hora:", error);
    }

    setEditando(null);
  };
  const abrirContextMenu = (event, index) => {
    event.preventDefault();

    // Dimensões do menu (ajusta se mudares o CSS)
    const menuWidth = 180;
    const menuHeight = 160;

    // Posição do clique
    let x = event.clientX;
    let y = event.clientY;

    // Ajusta se sair fora do ecrã
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({
      x,
      y,
      index,
      dia: dados[index].dia,
      isFerias: dados[index].isFerias
    });
  };  
    
  return (
    <>
    {contextMenu && (
      <div
        className="context-menu"
        style={{
          position: "fixed", // importante para usar clientX/clientY
          top: `${contextMenu.y}px`,
          left: `${contextMenu.x}px`,
          zIndex: 1000
        }}
        onClick={() => setContextMenu(null)}
      >
        <RegisterVacation username= {cleanUsername(username)} date={contextMenu.dia} onSuccess={fetchData} />
        <MedicalLeave username={cleanUsername(username)} date={contextMenu.dia} onSuccess={fetchData} />
        <DeleteRegister username= {cleanUsername(username) } date={contextMenu.dia} onSuccess={fetchData} />
        <button>Cancelar</button>
      </div>
    )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora Entrada</th>
              <th>Hora Saída</th>
              <th>Total Horas Trabalhadas</th>
              {/*<th>Horas Extra</th>*/}
            </tr>
          </thead>
          <tbody>
            {dados.map((item, index) => {
              const isLessThanEightHours = item.total !== "-" && parseInt(item.total.split("h")[0]) < 8;

              return (
                <tr key={index} onContextMenu={(e) => abrirContextMenu(e, index)}>
                  <td>{item.dia}</td>
                  <td onClick={() => ativarEdicao(index, "horaEntrada", item.horaEntrada)}>
                    {editando?.index === index && editando?.campo === "horaEntrada" ? (
                      <input
                        type="time"
                        value={novoValor}
                        onChange={(e) => setNovoValor(e.target.value)}
                        onBlur={() => salvarEdicao(index)}
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao(index)}
                        autoFocus
                      />
                    ) : (
                      item.horaEntrada
                    )}
                  </td>
                  <td onClick={() => ativarEdicao(index, "horaSaida", item.horaSaida)}>
                    {editando?.index === index && editando?.campo === "horaSaida" ? (
                      <input
                        type="time"
                        value={novoValor}
                        onChange={(e) => setNovoValor(e.target.value)}
                        onBlur={() => salvarEdicao(index)}
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao(index)}
                        autoFocus
                      />
                    ) : (
                      item.horaSaida
                    )}
                  </td>
                  <td className={isLessThanEightHours ? "less-than-eight" : ""}>{item.total}</td>
                  {/*<td>{item.extra}</td>*/}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TableHours;