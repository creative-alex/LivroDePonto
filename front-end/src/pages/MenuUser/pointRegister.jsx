import { useState, useEffect } from "react";
import { calcularHoras, formatarMinutos } from "../../components/Hours/calcHours";

const feriadosPorto = [
  "01-01", "25-04", "01-05", "10-06", "15-08", "05-10", "01-11", "01-12", "08-12", "25-12"
];

const TableHours = ({ username, month = new Date().getMonth() + 1 }) => {
  console.log("Componente TableHours renderizado");
  console.log("Props recebidas:", { username, month });

  const [dados, setDados] = useState(() => {
    const diasNoMes = new Date(new Date().getFullYear(), month, 0).getDate();
    console.log("Dias no mês (inicial):", diasNoMes);
    const estruturaInicial = Array.from({ length: diasNoMes }, (_, i) => ({
      dia: `${String(i + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`,
      horaEntrada: "-",
      horaSaida: "-",
      total: "-",
      extra: "-",
    }));
    console.log("Estrutura inicial de dados:", estruturaInicial);
    return estruturaInicial;
  });

  const [totais, setTotais] = useState({
    totalHoras: "0h 0m",
    totalExtras: "0h 0m",
    diasFalta: 0,
    diasFerias: 0,
  });

  useEffect(() => {
    console.log("Entrando no useEffect com deps:", { username, month });

    if (!username) {
      console.warn("Parâmetros inválidos:", { username, month });
      return;
    }

    console.log("Iniciando fetchData...");

    const fetchData = async () => {
      try {
        console.log("Enviando requisição para API com:", {
          url: "http://localhost:4005/users/calendar",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, month }),
        });

        const response = await fetch("http://localhost:4005/users/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, month }),
        });

        console.log("Resposta recebida da API:", response);

        if (!response.ok) {
          console.error("Erro na resposta da API:", response.status, response.statusText);
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const respostaJson = await response.json();
        console.log("Dados JSON recebidos da API:", respostaJson);

        const { registros = [], ferias = [] } = respostaJson;

        console.log("Registros obtidos:", registros);
        console.log("Dias de férias obtidos:", ferias);

        const diasNoMes = new Date(new Date().getFullYear(), month, 0).getDate();
        console.log("Número de dias no mês (pós-API):", diasNoMes);

        let totalMinutos = 0;
        let totalMinutosExtras = 0;
        let diasFalta = 0;
        let diasFerias = ferias.length;

        let novosDados = Array.from({ length: diasNoMes }, (_, i) => ({
          dia: `${String(i + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`,
          horaEntrada: "-",
          horaSaida: "-",
          total: "-",
          extra: "-",
        }));

        console.log("Estrutura inicial de novosDados:", novosDados);

        const hoje = new Date();
        console.log("Data atual:", hoje);

        novosDados = novosDados.map((item, index) => {
          const dataAtual = new Date(hoje.getFullYear(), month - 1, index + 1);
          const diaSemana = dataAtual.getDay();
          const feriado = feriadosPorto.includes(item.dia);
          const registo = registros.find((r) => new Date(r.timestamp).getDate() === index + 1);

          console.log(`Processando dia ${index + 1}:`, {
            dataAtual,
            diaSemana,
            feriado,
            registo,
          });

          if (registo) {
            console.log("Registo encontrado:", registo);
            const { total, extra, minutos, minutosExtras } = calcularHoras(registo.horaEntrada, registo.horaSaida);
            console.log("Horas calculadas:", { total, extra, minutos, minutosExtras });

            totalMinutos += minutos;
            totalMinutosExtras += minutosExtras;

            return {
              ...item,
              horaEntrada: registo.horaEntrada || "-",
              horaSaida: registo.horaSaida || "-",
              total,
              extra,
            };
          } else if (dataAtual < hoje && diaSemana !== 0 && diaSemana !== 6 && !feriado) {
            console.warn(`Dia ${index + 1} sem registo. Contabilizando como falta.`);
            diasFalta++;
            return { ...item, total: "0h 0m" };
          }

          console.log(`Dia ${index + 1} é fim de semana ou feriado.`);
          return item;
        });

        console.log("Novos dados após processamento:", novosDados);

        console.log("Resumo final:", {
          totalHoras: formatarMinutos(totalMinutos),
          totalExtras: formatarMinutos(totalMinutosExtras),
          diasFalta,
          diasFerias,
        });

        setTotais({
          totalHoras: formatarMinutos(totalMinutos),
          totalExtras: formatarMinutos(totalMinutosExtras),
          diasFalta,
          diasFerias,
        });

        setDados(novosDados);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 1000000);
    console.log("Intervalo configurado para 10 segundos.");

    return () => {
      console.log("Limpando intervalo.");
      clearInterval(interval);
    };
  }, [username, month]);

  console.log("Estado final de dados antes de renderizar:", dados);


  return (
    <div className="table-container flex-center">
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
              <td>{item.horaEntrada}</td>
              <td>{item.horaSaida}</td>
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
            <td colSpan="3"><strong>Dias de Falta</strong></td>
            <td colSpan="2"><strong>{totais.diasFalta}</strong></td>
          </tr>
          <tr>
            <td colSpan="3"><strong>Dias de Férias</strong></td>
            <td colSpan="2"><strong>{totais.diasFerias}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TableHours;