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
        let novosDados = Array.from({ length: diasNoMes }, (_, i) => ({
          dia: `${String(i + 1).padStart(2, "0")}-${String(month).padStart(2, "0")}`,
          entrada: "-",
          saida: "-",
          total: "-",
          extra: "-",
        }));

        if (response.ok) {
          const registros = await response.json();
          novosDados = novosDados.map((item, index) => {
            const registro = registros.find((r) => new Date(r.timestamp).getDate() === index + 1);
            
            if (registro) {
              const { total, extra } = calcularHoras(registro.horaEntrada, registro.horaSaida);
              return {
                ...item,
                entrada: registro.horaEntrada || "-",
                saida: registro.horaSaida || "-",
                total,
                extra,
              };
            }
            return item;
          });
        }

        setDados(novosDados);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
      }
    };

    fetchData();
  }, [username, month]);

  const calcularHoras = (entrada, saida) => {
    if (!entrada || !saida) return { total: "-", extra: "-" };

    const [hEntrada, mEntrada] = entrada.split(":").map(Number);
    const [hSaida, mSaida] = saida.split(":").map(Number);

    if (isNaN(hEntrada) || isNaN(mEntrada) || isNaN(hSaida) || isNaN(mSaida)) {
      return { total: "-", extra: "-" };
    }

    let horasTrabalhadas = hSaida - hEntrada;
    let minutosTrabalhados = mSaida - mEntrada;

    if (minutosTrabalhados < 0) {
      minutosTrabalhados += 60;
      horasTrabalhadas -= 1;
    }

    const totalHoras = `${horasTrabalhadas}h ${minutosTrabalhados}m`;

    const horasExtras = horasTrabalhadas > 8 ? horasTrabalhadas - 8 : 0;
    const minutosExtras = horasExtras > 0 ? minutosTrabalhados : 0;
    const extra = horasExtras > 0 ? `${horasExtras}h ${minutosExtras}m` : "-";

    return { total: totalHoras, extra };
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
        </tbody>
      </table>
      <ExportButton dados={dados} isSuperAdmin={isSuperAdmin} />
    </div>
  );
};

export default TableHours;
