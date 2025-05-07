import { useState, useEffect } from "react";
import ExportExcel from "./ExportExcel";
import { calcularHoras, formatarMinutos } from "../../../components/Hours/calcHours";
import RegisterVacation from "../buttons/registerVacationButton";
import DeleteRegister from "../buttons/deleteRegisterButton";

const feriadosPorto = [
  "01-01", "25-04", "01-05", "10-06", "15-08", "05-10", "01-11", "01-12", "08-12", "25-12"
];

const TableHours = ({ username, month, onTotaisChange }) => {
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState({totalHoras: "0h 0m", totalExtras: "0h 0m", diasFalta: 0, diasFerias: 0});  
  const [editando, setEditando] = useState(null);
  const [novoValor, setNovoValor] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  
  useEffect(() => {
    if (!username || !month) return;

    fetchData();
  }, [username, month]);

  const fetchData = async () => {
    try {
      const response = await fetch("https://api-ls3q.onrender.com/users/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, month }),
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
      }));
  
      const data = response.ok ? await response.json() : { registos: [], ferias: [] };
      const registos = Array.isArray(data.registros) ? data.registros : [];
      const ferias = Array.isArray(data.ferias) ? data.ferias : [];
  
      const hoje = new Date();
  
      novosDados = novosDados.map((item, index) => {
        const registo = registos.find((r) => new Date(r.timestamp).getDate() === index + 1);
        const dataAtual = new Date(hoje.getFullYear(), month - 1, index + 1);
        const diaSemana = dataAtual.getDay();
        const feriado = feriadosPorto.includes(`${String(index + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`);
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
  
      const diasFalta = novosDados.filter(d => d.total === "0h 0m" && !d.isFerias).length;
      const diasFerias = novosDados.filter(d => d.isFerias).length;

      const novosTotais = {
        totalHoras: formatarMinutos(totalMinutos),
        totalExtras: formatarMinutos(totalMinutosExtras),
        diasFalta,
        diasFerias
      };

      setTotais(novosTotais);
      setDados(novosDados);

      // Chama a função de callback para enviar os totais ao UserDetails
      if (onTotaisChange) {
        onTotaisChange(novosTotais);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar horários:", error);
      setTotais({
        totalHoras: "0h 0m",
        totalExtras: "0h 0m",
        totalFaltas: "0h 0m",
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
          username,
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
          top: contextMenu.y,
          left: contextMenu.x,
        }}
        onClick={() => setContextMenu(null)}
      >
        <RegisterVacation username={username} date={contextMenu.dia} onSuccess={fetchData} />
        <DeleteRegister username={username} date={contextMenu.dia} onSuccess={fetchData} />
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
      <ExportExcel month={month} username={username} dados={dados} totais={totais} />
    </>
  );
};

export default TableHours;