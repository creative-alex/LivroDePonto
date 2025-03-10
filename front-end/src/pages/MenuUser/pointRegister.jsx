import { useState, useEffect } from "react";
import { calcularHoras, formatarMinutos } from "../../components/Hours/calcHours";


const feriadosPorto = [
  "01-01", "25-04", "01-05", "10-06", "15-08", "05-10", "01-11", "01-12", "08-12", "25-12"
];

const TableHours = ({ username, month }) => {
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState({ totalHoras: "0h 0m", totalExtras: "0h 0m", totalFaltas: "0h 0m" });

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
          entrada: "-",
          saida: "-",
          total: "-",
          extra: "-",
        }));

        if (response.ok) {
          const registros = await response.json();
          const hoje = new Date();

          novosDados = novosDados.map((item, index) => {
            const registro = registros.find((r) => new Date(r.timestamp).getDate() === index + 1);
            const dataAtual = new Date(hoje.getFullYear(), month - 1, index + 1);
            const diaSemana = dataAtual.getDay();
            const feriado = feriadosPorto.includes(`${String(index + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`);

            if (registro) {
              const { total, extra, minutos, minutosExtras, minutosFalta } = calcularHoras(registro.horaEntrada, registro.horaSaida);
              totalMinutos += minutos;
              totalMinutosExtras += minutosExtras;
              totalMinutosFaltas += minutosFalta;
              return {
                ...item,
                entrada: registro.horaEntrada || "-",
                saida: registro.horaSaida || "-",
                total,
                extra,
              };
            } else if (dataAtual < hoje && diaSemana !== 0 && diaSemana !== 6 && !feriado) {
              totalMinutosFaltas += 480;
              return { ...item, total: "0h 0m" };
            }
            return item;
          });
        }

        setTotais({
          totalHoras: formatarMinutos(totalMinutos),
          totalExtras: formatarMinutos(totalMinutosExtras),
          totalFaltas: formatarMinutos(totalMinutosFaltas)
        });

        setDados(novosDados);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [username, month]);

  return (
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
            <tr key={index}>
              <td>{item.dia}</td>
              <td>{item.entrada}</td>
              <td>{item.saida}</td>
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
  );
};

export default TableHours;