export const calcularHoras = (entrada, saida) => {
    if (!entrada || !saida) return { total: "-", extra: "-", minutos: 0, minutosExtras: 0, minutosFalta: 480 };
  
    const [hEntrada, mEntrada] = entrada.split(":").map(Number);
    const [hSaida, mSaida] = saida.split(":").map(Number);
  
    if (isNaN(hEntrada) || isNaN(mEntrada) || isNaN(hSaida) || isNaN(mSaida)) {
      return { total: "-", extra: "-", minutos: 0, minutosExtras: 0, minutosFalta: 480 };
    }
  
    let minutosTrabalhados = (hSaida * 60 + mSaida) - (hEntrada * 60 + mEntrada);
    if (minutosTrabalhados > 300) {
      minutosTrabalhados -= 60;
    }
  
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
  
  export const formatarMinutos = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    return `${horas}h ${minutosRestantes}m`;
  };
  