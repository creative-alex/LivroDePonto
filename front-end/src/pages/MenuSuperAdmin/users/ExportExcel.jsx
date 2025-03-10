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

    // Estilizando cabeçalhos
    const headerRow = ws.addRow([
      "Dia/Mês", "Hora Entrada", "Pausa", "Hora Saída", "Total Horas Normais", "Total Horas Extra", "Justificação de Atraso/Falta", "Assinatura Colaborador/a"
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
      console.log(dados);
      let totalHoras = rowData.total || "";
      let horasExtra = rowData.extra || "";
      let justificativa = "";

      if (totalHoras === "Férias" || horasExtra === "Férias") {
        totalHoras = "0h 0m";
        horasExtra = "0h 0m";
        justificativa = "Férias";
      }

      const row = ws.addRow([
        rowData.dia || "",
        rowData.entrada || "",
        rowData.pausa || "",  
        rowData.saida || "",
        totalHoras,
        horasExtra,
        justificativa,
        ""
      ]);
      

      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Linha vazia
    ws.addRow([]);

    // Assinatura RH antes da tabela de totais
    ws.addRow(["", "", "", "", "Assinatura RH:", "____________________________________"]);
    const assinaturaRow = ws.lastRow;
    assinaturaRow.eachCell((cell, colNumber) => {
      if (colNumber === 5) {
        cell.font = { bold: true };
      }
    });

    // Linha vazia
    ws.addRow([]);

    // Criando tabela de totais estilizada
    const totalHeaders = ["Descrição", "Total"];
    const totalValues = [
      ["Total de Horas", totais.totalHoras],
      ["Horas Extras", totais.totalExtras],
      ["Horas Faltadas", totais.totalFaltas],
    ];
    
    const totalHeaderRow = ws.addRow(totalHeaders);
    totalHeaderRow.eachCell((cell) => {
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

    totalValues.forEach((row) => {
      const dataRow = ws.addRow(row);
      dataRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Ajustando larguras das colunas
    ws.columns = [
      { width: 15 }, // Dia/Mês
      { width: 15 }, // Hora Entrada
      { width: 10 }, // Pausa
      { width: 15 }, // Hora Saída
      { width: 20 }, // Total Horas Normais
      { width: 15 }, // Total Horas Extra
      { width: 30 }, // Justificação de Atraso/Falta
      { width: 25 }, // Assinatura Colaborador/a
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
