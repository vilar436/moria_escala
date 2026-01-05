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
  value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
  value = value.substring(0, 11); // Limita a 11 dígitos

  const size = value.length;
  if (size <= 2) {
    return value.replace(/^(\d{0,2})/, "($1");
  }
  if (size <= 6) {
    return value.replace(/^(\d{2})(\d{0,4})/, "($1) $2");
  }
  if (size <= 10) {
    return value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
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