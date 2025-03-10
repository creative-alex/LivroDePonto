import { useState, useEffect } from "react";
import ExportExcel from "./ExportExcel";
import { calcularHoras, formatarMinutos } from "../../../components/Hours/calcHours";
import RegisterVacation from "../buttons/registerVacationButton";
import DeleteRegister from "../buttons/deleteRegisterButton";

const feriadosPorto = [
  "01-01", "25-04", "01-05", "10-06", "15-08", "05-10", "01-11", "01-12", "08-12", "25-12"
];

const TableHours = ({ username, month }) => {
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState({ totalHoras: "0h 0m", totalExtras: "0h 0m", totalFaltas: "0h 0m" });
  const [editando, setEditando] = useState(null);
  const [novoValor, setNovoValor] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  

  useEffect(() => {
    if (!username || !month) return;
  
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:4005/users/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, month }),
        });
  
        const diasNoMes = new Date(new Date().getFullYear(), month, 0).getDate();
        let totalMinutos = 0;
        let totalMinutosExtras = 0;
        let totalMinutosFaltas = 0;
  
        let novosDados = Array.from({ length: diasNoMes }, (_, i) => ({
          dia: `${String(i + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`,
          horaEntrada: "-",
          horaSaida: "-",
          total: "-",
          extra: "-",
          isFerias: false,
        }));
  
        const data = response.ok ? await response.json() : { registros: [], ferias: [] };
        const registros = Array.isArray(data.registros) ? data.registros : [];
        const ferias = Array.isArray(data.ferias) ? data.ferias : [];
  
        const hoje = new Date();
  
        novosDados = novosDados.map((item, index) => {
          const registro = registros.find((r) => new Date(r.timestamp).getDate() === index + 1);
          const dataAtual = new Date(hoje.getFullYear(), month - 1, index + 1);
          const diaSemana = dataAtual.getDay();
          const feriado = feriadosPorto.includes(`${String(index + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`);
          const estaDeFerias = ferias.includes(item.dia);
  
          if (estaDeFerias) {
            return { ...item, horaEntrada: "Férias", horaSaida: "Férias", total: "Férias", extra: "Férias", isFerias: true };
          }
  
          if (registro) {
            const { total, extra, minutos, minutosExtras, minutosFalta } = calcularHoras(registro.horaEntrada, registro.horaSaida);
            totalMinutos += minutos;
            totalMinutosExtras += minutosExtras;
            totalMinutosFaltas += minutosFalta;
            return {
              ...item,
              horaEntrada: registro.horaEntrada || "-",
              horaSaida: registro.horaSaida || "-",
              total,
              extra,
            };
          } else if (!estaDeFerias && dataAtual < hoje && dataAtual.toDateString() !== hoje.toDateString() && diaSemana !== 0 && diaSemana !== 6 && !feriado) {
            totalMinutosFaltas += 480;
            return { ...item, horaEntrada: "-", horaSaida: "-", total: "0h 0m", extra: "0h 0m" };
          }
  
          return item;
        });
  
        setTotais({
          totalHoras: formatarMinutos(totalMinutos),
          totalExtras: formatarMinutos(totalMinutosExtras),
          totalFaltas: formatarMinutos(totalMinutosFaltas),
        });
  
        setDados(novosDados);
      } catch (error) {
        console.error("❌ Erro ao buscar horários:", error);
        setTotais({
          totalHoras: "0h 0m",
          totalExtras: "0h 0m",
          totalFaltas: "0h 0m",
        });
      }
    };
  
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [username, month]);
  

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
      const response = await fetch("http://localhost:4005/users/update-time", {
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
    } catch (error) {
      console.error("❌ Erro ao atualizar hora:", error);
    }

    setEditando(null);
  };

  const abrirContextMenu = (event, index) => {
    event.preventDefault();
    setContextMenu({
      x: event.pageX, // Usa pageX para considerar o scroll
      y: event.pageY, // Usa pageY para evitar deslocamento
      index,
      dia: dados[index].dia,
      isFerias: dados[index].isFerias
    });
  };
  
    
  return (
    <>
     {contextMenu && (
  <div className="context-menu"
    style={{
      position: "absolute",
      top: contextMenu.y,
      left: contextMenu.x,
      background: "#fff",
      border: "1px solid #ccc",
      padding: "8px",
      boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
      zIndex: 1000
    }}
    onClick={() => setContextMenu(null)} 
  >
    <RegisterVacation username={username} date={contextMenu.dia} />
    <DeleteRegister username={username} date={contextMenu.dia} />
    <button>Cancelar</button>
  </div>
)}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Hora Entrada</th>
              <th>Hora Saída</th>
              <th>Total Horas</th>
              <th>Horas Extra</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item, index) => (
             <tr key={index} onContextMenu={(e) => abrirContextMenu(e, index)}
              >
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
                <td>{item.total}</td>
                <td>{item.extra}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3"><strong>Totais</strong></td>
              <td><strong>{totais.totalHoras}</strong></td>
              <td><strong>{totais.totalExtras}</strong></td>
            </tr>
            <tr>
              <td colSpan="3"><strong>Horas Faltadas</strong></td>
              <td colSpan="2"><strong>{totais.totalFaltas}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <ExportExcel month={month} username={username} dados={data} totais={totais} />
    </>
  );
};

export default TableHours;