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
    const ws = wb.addWorksheet("registo de Ponto");

    // Título
    const monthName = getMonthName(month);
    const title = `Registo ${monthName} ${username}`;
    const titleRow = ws.addRow([title]);

    titleRow.eachCell((cell) => {
      cell.font = { bold: true, size: 16 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Mesclar células para o título
    ws.mergeCells(`A1:G1`);

    // Cabeçalhos
    const headerRow = ws.addRow([
      "Dia/Mês", "Hora Entrada", "Pausa", "Hora Saída", "Total Horas Trabalhadas", 
      "Total Horas Extra", "Observação"
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0070C0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    // Dados
    dados.forEach((rowData) => {
      let totalHoras = rowData.total || "";
      let horasExtra = rowData.extra || "";
      let justificativa = "";

      if (totalHoras === "Férias" || horasExtra === "Férias") {
        rowData.pausa = "Férias";
        justificativa = "Férias";
      } 

      if (rowData.horaEntrada === "Férias" || rowData.horaSaida === "Férias") {
        rowData.pausa = "Férias";
      } else if (rowData.horaEntrada !== "-" && rowData.horaSaida !== "-") {
        rowData.pausa = "13h - 13h30";
      } else {
        rowData.pausa = "-";
      }

      const row = ws.addRow([
        rowData.dia || "",
        rowData.horaEntrada || "",
        rowData.pausa || "",  
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
    ws.addRow(["", "", "", "", "Nome do/a Colaborador/a:", "____________________________________________"]);
    ws.addRow([]);
    ws.addRow(["", "", "", "", "Assinatura do/a Responsavel:", "____________________________________________"]);
    ws.addRow([]);
    ws.addRow(["", "", "", "", "Assinatura do/a Colaborador/a:", "____________________________________________"]);

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
      ["Dias de Falta", totais.diasFalta],
      ["Dias de Férias", totais.diasFerias]
    ].forEach((row) => {
      ws.addRow(row).eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
    });

    ws.columns = [
      { width: 15 }, { width: 15 }, { width: 10 }, { width: 15 }, 
      { width: 25 }, { width: 15 }, { width: 30 }, { width: 0 }
    ];
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileName = `Registo_${monthName}_${username}.xlsx`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  return (
    <button onClick={exportToExcel} className="excel-btn">
      Exportar para Excel
    </button>
  );
};

export default ExportExcel;
