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

    const monthName = getMonthName(month);

    // Título
    ws.addRow(["REGISTO DE PONTO"]);
    ws.mergeCells("A1:E1");
    ws.getRow(1).font = { bold: true, size: 16 };
    ws.getRow(1).alignment = { horizontal: "left" };

    // Nome do colaborador
    ws.addRow([`Nome do/a Colaborador/a: ${username}`]);
    ws.mergeCells("A2:E2");

    // Mês
    ws.addRow([`Mês:  ${monthName} de ${new Date().getFullYear()}`]);
    ws.mergeCells("A3:E3");

    ws.addRow([]);

    // Cabeçalho da tabela
    const headerRow = ws.addRow(["Dia/Mês", "Hora Entrada", "Pausa", "Hora Saída", "Observação"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0070C0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // Dados
    dados.forEach((rowData) => {
      let pausa = rowData.pausa || "";
      if (
        (rowData.horaEntrada === "Férias" || rowData.horaSaida === "Férias") ||
        (rowData.total === "Férias" || rowData.extra === "Férias")
      ) {
        pausa = "Férias";
      } else if (rowData.horaEntrada && rowData.horaEntrada !== "-" && rowData.horaSaida && rowData.horaSaida !== "-") {
        pausa = "13h - 13h30";
      } else {
        pausa = "-";
      }
      const row = ws.addRow([
        rowData.dia || "",
        rowData.horaEntrada || "",
        pausa,
        rowData.horaSaida || "",
        rowData.observacao || ""
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

    // 4 linhas em branco
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]);

    // Adicionar tabela pequena com totais
    const totalHeaderRow = ws.addRow(["Resumo Mensal"]);
    totalHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0070C0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    ws.mergeCells(`A${totalHeaderRow.number}:E${totalHeaderRow.number}`);

    ws.addRow(["Horas Totais Mensais", totais.totalHoras || "", "", "", ""]);
    ws.addRow(["Horas Totais Normais", totais.totalNormais || "", "", "", ""]);
    ws.addRow(["Horas Extras", totais.totalExtras || "", "", "", ""]);

    // Estilizar as linhas de totais
    const totalRows = ws.getRows(totalHeaderRow.number + 1, 3); // Pega as 3 linhas abaixo do cabeçalho
    totalRows.forEach((row) => {
      row.eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    });

    // Ajuste de largura das colunas
    ws.columns = [
      { width: 15 }, // Dia/Mês
      { width: 15 }, // Hora Entrada
      { width: 15 }, // Pausa
      { width: 15 }, // Hora Saída
      { width: 60 }  // Observação/Assinaturas
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
    <button className="exc" onClick={exportToExcel}>Exportar para Excel</button>
  );
};

export default ExportExcel;
