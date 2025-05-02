import { useState, useEffect } from "react";
import { calcularHoras, formatarMinutos } from "../../components/Hours/calcHours";
import capa from "../../assets/capa.jpg";
import LogoutButton from "../../components/LogoutButton/logoutButton";
import EntryButton from "./buttons/entryRegisterButton";
import ExitButton from "./buttons/exitRegisterButton";


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

    if (!username) {
      console.warn("Parâmetros inválidos:", { username, month });
      return;
    }


    const fetchData = async () => {
      try {
        console.log("Enviando requisição para API com:", {
          url: "https://api-ls3q.onrender.com/users/calendar",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, month }),
        });

        const response = await fetch("https://api-ls3q.onrender.com/users/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, month }),
        });


        if (!response.ok) {
          console.error("Erro na resposta da API:", response.status, response.statusText);
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const respostaJson = await response.json();
        console.log("Dados JSON recebidos da API:", respostaJson);

        const { registros = [], ferias = [] } = respostaJson;


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

  }, [username, month]);

  const handleLogout = () => {
    localStorage.removeItem("user");
  };

  return (
    <>
    <div style={{ width: '30vw' }}>
        <div className="cut">
            <img src={capa} alt="Capa" className="capa cut" />
        </div>
            <LogoutButton onLogout={handleLogout} />
    </div>
    <div className="flex-center nav-container">
      <EntryButton username={username}  />      
     
      <ExitButton username={username} />
    </div>
    <div className="ent-info">
                <h2>Totais</h2>
                <p><strong>Horas Normais Mensais:</strong> {totais.totalHoras}</p>
                <p><strong>Horas Extras Mensais:</strong> {totais.totalExtras}</p>
                <p><strong>Dias de Falta:</strong> {totais.diasFalta}</p>
                <p><strong>Dias de Férias:</strong> {totais.diasFerias}</p>
              </div>
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
        </tbody>
      </table>
    </div>
    </>
  );
};

export default TableHours;