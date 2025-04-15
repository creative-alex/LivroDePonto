import ExcelJS from "exceljs";

const MultipleExcel = async ({ dadosPorUsuario, month }) => {
  const getMonthName = (monthNumber) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    return months[monthNumber - 1] || "Mês_Inválido";
  };

  const wb = new ExcelJS.Workbook();

  // Cria uma aba para cada usuário
  for (const [username, { dados = [], totais = {} }] of Object.entries(dadosPorUsuario)) {
    const ws = wb.addWorksheet(username);

    // Cabeçalhos
    const headerRow = ws.addRow([
      "Dia/Mês", "Hora Entrada", "Pausa", "Hora Saída", "Total Horas Normais",
      "Total Horas Extra", "Justificação de Atraso/Falta", "Assinatura Colaborador/a",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0070C0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Dados (preenche com valores padrão se não houver registros)
    if (dados.length === 0) {
      ws.addRow(["Sem registros", "-", "-", "-", "-", "-", "-", "-"]).eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    } else {
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
          rowData.pausa = "30 min.";
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
          "",
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
    }

    // Espaço e Assinatura RH
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow(["", "", "", "", "Assinatura GRH:", "_____________________________________________________________________"]);
    ws.addRow([]);

    // Totais
    ws.addRow(["Descrição", "Total"]).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0070C0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    [
      ["Total de Horas", totais.totalHoras || "0h 0m"],
      ["Horas Extras", totais.totalExtras || "0h 0m"],
      ["Dias de Falta", totais.diasFalta || 0],
      ["Dias de Férias", totais.diasFerias || 0],
    ].forEach((row) => {
      ws.addRow(row).eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Ajustar largura das colunas
    ws.columns = [
      { width: 15 }, { width: 15 }, { width: 10 }, { width: 15 },
      { width: 20 }, { width: 15 }, { width: 30 }, { width: 25 },
    ];
  }

  // Gerar o arquivo Excel
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const monthName = getMonthName(month);
  const fileName = `Registo_Múltiplo_${monthName}.xlsx`;

  // Baixar o arquivo
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
};

export default MultipleExcel;