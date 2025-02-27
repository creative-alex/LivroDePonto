import ExcelJS from "exceljs";

const ExportExcel = ({ dados, username, month }) => {
  const getMonthName = (monthNumber) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[monthNumber - 1] || "Mês_Inválido"; // Ajustando para índices baseados em 1
  };

  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Registro de Ponto");

    // Definir estilos para cabeçalhos
    const headerRow = ws.addRow([
      "Dia", "Hora Entrada", "Hora Saída", "Total Horas", "Horas Extra", "Assinatura Funcionário"
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0070C0" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Adicionando os dados
    dados.forEach((rowData) => {
      const row = ws.addRow([
        rowData.dia || "",
        rowData.entrada || "",
        rowData.saida || "",
        rowData.total || "",
        rowData.extra || "",
        ""
      ]);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Linha vazia + Assinatura RH
    ws.addRow([]);
    const assinaturaRow = ws.addRow(["", "", "", "", "Assinatura RH:", "____________________"]);
    assinaturaRow.eachCell((cell, colNumber) => {
      if (colNumber === 5) {
        cell.font = { bold: true };
      }
    });

    // Ajustando larguras das colunas
    ws.columns = [
      { width: 15 }, // Dia
      { width: 20 }, // Hora Entrada
      { width: 20 }, // Hora Saída
      { width: 15 }, // Total Horas
      { width: 15 }, // Horas Extra
      { width: 30 }, // Assinatura
    ];

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // Converter número do mês para nome
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
