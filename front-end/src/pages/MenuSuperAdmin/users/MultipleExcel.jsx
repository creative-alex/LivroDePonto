import ExcelJS from "exceljs";

const ExportExcel = async ({ dados, totais, username, month }) => {
  const getMonthName = (monthNumber) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    return months[monthNumber - 1] || "Mês_Inválido";
  };

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Registo de Ponto");

  // Cabeçalhos
  ws.addRow([
    "Dia/Mês", "Hora Entrada", "Pausa", "Hora Saída", "Total Horas Normais",
    "Total Horas Extra", "Justificação de Atraso/Falta", "Assinatura Colaborador/a",
  ]);

  // Dados
  dados.forEach((rowData) => {
    ws.addRow([
      rowData.dia || "",
      rowData.horaEntrada || "",
      rowData.pausa || "",
      rowData.horaSaida || "",
      rowData.total || "",
      rowData.extra || "",
      "",
      "",
    ]);
  });

  // Totais
  ws.addRow([]);
  ws.addRow(["Total de Horas", totais.totalHoras || "0h 0m"]);
  ws.addRow(["Horas Extras", totais.totalExtras || "0h 0m"]);
  ws.addRow(["Dias de Falta", totais.diasFalta || 0]);
  ws.addRow(["Dias de Férias", totais.diasFerias || 0]);

  // Ajustar largura das colunas
  ws.columns = [
    { width: 15 }, { width: 15 }, { width: 10 }, { width: 15 },
    { width: 20 }, { width: 15 }, { width: 30 }, { width: 25 },
  ];

  // Gerar o arquivo Excel
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const monthName = getMonthName(month);
  const fileName = `Registo_${username}_${monthName}.xlsx`;

  // Baixar o arquivo
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
};

export default ExportExcel;