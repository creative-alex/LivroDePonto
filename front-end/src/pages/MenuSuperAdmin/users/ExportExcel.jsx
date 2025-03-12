import ExcelJS from "exceljs";

const ExportExcel = ({ dados, totais, username, month }) => {
  const getMonthName = (monthNumber) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[monthNumber - 1] || "Mês_Inválido";
  };

  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Registro de Ponto");

    // Cabeçalhos
    const headerRow = ws.addRow([
      "Dia/Mês", "Hora Entrada", "Pausa", "Hora Saída", "Total Horas Normais", 
      "Total Horas Extra", "Justificação de Atraso/Falta", "Assinatura Colaborador/a"
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0070C0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    // Dados
    dados.forEach((rowData) => {
      console.log("Processando dia:", rowData.dia);
      console.log("Entrada:", rowData.horaEntrada, "Saída:", rowData.horaSaida);
    
      let totalHoras = rowData.total || "";
      let horasExtra = rowData.extra || "";
      let justificativa = "";
    
      if (totalHoras === "Férias" || horasExtra === "Férias") {
        totalHoras = "0h 0m";
        horasExtra = "0h 0m";
        justificativa = "Férias";
      }
    
      if (dados.horaEntrada && dados.horaSaida) { 
        console.log("Definindo pausa para 30 min.");
        rowData.pausa = "30 min.";
      } else {
        console.log("Sem entrada e saída registradas, não definindo pausa.");
      }
    
      const row = ws.addRow([
        rowData.dia || "",
        rowData.horaEntrada || "",
        rowData.pausa || "",  // Aqui deveria aparecer "30 min."
        rowData.horaSaida || "",
        totalHoras,
        horasExtra,
        justificativa,
        ""
      ]);
    
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { 
          top: { style: "thin" }, 
          left: { style: "thin" }, 
          bottom: { style: "thin" }, 
          right: { style: "thin" } 
        };
      });
    });
    
    
    

    // Espaço e Assinatura RH
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow(["", "", "", "", "Assinatura RH:", "_____________________________________________________________________"]);
    ws.addRow([]);

    // Totais
    ws.addRow(["Descrição", "Total"]).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0070C0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    [
      ["Total de Horas", totais.totalHoras],
      ["Horas Extras", totais.totalExtras],
      ["Dias de Falta", totais.diasDeFalta],
      ["Dias de Férias", totais.diasDeFerias]
    ].forEach((row) => {
      ws.addRow(row).eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
    });

    // Ajustando colunas
    ws.columns = [
      { width: 15 }, { width: 15 }, { width: 10 }, { width: 15 }, 
      { width: 20 }, { width: 15 }, { width: 30 }, { width: 25 }
    ];
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const monthName = getMonthName(month);
    const fileName = `Registro_${monthName}_${username}.xlsx`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  return (
    <button onClick={exportToExcel} className="ex">
      Exportar para Excel
    </button>
  );
};

export default ExportExcel;
