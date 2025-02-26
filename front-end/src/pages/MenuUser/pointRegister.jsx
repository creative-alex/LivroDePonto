import { useState, useEffect } from "react";
import ExcelJS from "exceljs";

const ExportButton = ({ dados, isSuperAdmin }) => {
  if (!isSuperAdmin) return null;

  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet 1");
    
    const headers = ["Dia", "Hora Entrada", "Hora Saída", "Total Horas", "Horas Extra"];
    ws.addRow(headers);
    
    dados.forEach(rowData => {
      ws.addRow(Object.values(rowData));
    });
    
    ws.columns = headers.map(header => ({ width: header.length + 5 }));
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exported_table.xlsx";
    link.click();
  };

  return <button onClick={exportToExcel}>Export to Excel</button>;
};

const TableHours = ({ username, month, isSuperAdmin }) => {
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
            } else if (dataAtual < hoje) {
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
  }, [username, month]);

  const calcularHoras = (entrada, saida) => {
    if (!entrada || !saida) return { total: "-", extra: "-", minutos: 0, minutosExtras: 0, minutosFalta: 480 };

    const [hEntrada, mEntrada] = entrada.split(":").map(Number);
    const [hSaida, mSaida] = saida.split(":").map(Number);

    if (isNaN(hEntrada) || isNaN(mEntrada) || isNaN(hSaida) || isNaN(mSaida)) {
      return { total: "-", extra: "-", minutos: 0, minutosExtras: 0, minutosFalta: 480 };
    }

    let minutosTrabalhados = (hSaida * 60 + mSaida) - (hEntrada * 60 + mEntrada);
    let minutosNormais = Math.min(minutosTrabalhados, 480);
    let minutosExtras = Math.max(0, minutosTrabalhados - 480);
    let minutosFalta = Math.max(0, 480 - minutosTrabalhados);

    return {
      total: formatarMinutos(minutosTrabalhados),
      extra: minutosExtras > 0 ? formatarMinutos(minutosExtras) : "-",
      minutos: minutosNormais,
      minutosExtras,
      minutosFalta
    };
  };

  const formatarMinutos = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    return `${horas}h ${minutosRestantes}m`;
  };

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
      <ExportButton dados={dados} isSuperAdmin={isSuperAdmin} />
    </div>
  );
};

export default TableHours;