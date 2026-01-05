export function formatDate(dateString: string) {
  // Parsing manually to avoid UTC conversion shifts
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function maskPhoneBR(value: string) {
  if (!value) return "";
  
  // Remove tudo que não for número
  let r = value.replace(/\D/g, "");
  r = r.substring(0, 11); // Limite de 11 dígitos (DDD + 9 dígitos)

  if (r.length > 10) {
    // Celular: (11) 99999-9999
    r = r.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (r.length > 5) {
    // Fixo ou digitando: (11) 9999-9999
    r = r.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (r.length > 2) {
    // Digitando DDD: (11) 9...
    r = r.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else if (r.length > 0) {
    // Iniciando: (1...
    r = r.replace(/^(\d*)/, "($1");
  }
  
  return r;
}

export function generateWhatsAppText(serviceDate: string, assignments: any[]) {
  const header = `*ESCALA DE SERVIÇO - ${serviceDate}*\n\n`;
  const body = assignments
    .map(a => `📍 *${a.area}*: ${a.userName}`)
    .join('\n');
  const footer = `\n\n_Que tudo seja feito para a glória de Deus!_`;
  return encodeURIComponent(header + body + footer);
}

export function downloadCSV(filename: string, rows: string[][]) {
  const content = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}