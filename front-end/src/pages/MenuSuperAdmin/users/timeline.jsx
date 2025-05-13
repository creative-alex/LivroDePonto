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
  
  console.log("Username:", username);

  const cleanUsername = (username) =>
  username.startsWith("user_") ? username.slice(5) : username;

  console.log("Cleaned Username:", cleanUsername(username));
  const fetchData = async () => {
    try {
      const response = await fetch("https://api-ls3q.onrender.com/users/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername(username), month }),
      });

      const data = response.ok ? await response.json() : { registros: [], ferias: [], baixas: [] };

      console.log("📥 Dados recebidos do backend:", data);

      const registros = Array.isArray(data.registros) ? data.registros : [];
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

      novosDados = novosDados.map((item) => {
        const registo = registros.find((r) => r.data === item.dia);
      
        if (registo) {
          if (registo.status === "Férias") {
            return {
              ...item,
              horaEntrada: "Férias",
              horaSaida: "Férias",
              total: "Férias",
              extra: "Férias",
              isFerias: true,
            };
          }
      
          if (registo.status === "Baixa Médica") {
            return {
              ...item,
              horaEntrada: "Baixa Médica",
              horaSaida: "Baixa Médica",
              total: "Baixa Médica",
              extra: "Baixa Médica",
              isBaixaMedica: true,
            };
          }
      
          // Verifique se há horas de entrada e saída
          const { total, extra, minutos, minutosExtras } = calcularHoras(registo.horaEntrada, registo.horaSaida);
          totalMinutos += minutos;
          totalMinutosExtras += minutosExtras;
      
          return {
            ...item,
            horaEntrada: registo.horaEntrada || "-", // Mostra "-" se não houver hora de entrada
            horaSaida: registo.horaSaida || "-",     // Mostra "-" se não houver hora de saída
            total,
            extra,
          };
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
    console.log("💾 Salvando edição para:", { index, campo: editando.campo, novoValor });

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

      console.log("📩 Resposta do servidor:", response);

      // Recarregar os dados após salvar a edição
      await fetchData();
    } catch (error) {
      console.error("❌ Erro ao atualizar hora:", error);
    }

    setEditando(null);
  };
  const abrirContextMenu = (event, index) => {
    event.preventDefault();
    setContextMenu({
      x: event.pageX, 
      y: event.pageY, 
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
          top: `${contextMenu.y}px`,
          left:  `${contextMenu.x}px`,
        }}
        onClick={() => setContextMenu(null)}
      >
        <RegisterVacation username= {cleanUsername(username)} date={contextMenu.dia} onSuccess={fetchData} />
        <DeleteRegister username= {cleanUsername(username) } date={contextMenu.dia} onSuccess={fetchData} />
        <MedicalLeave username={cleanUsername(username)} date={contextMenu.dia} onSuccess={fetchData} />
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