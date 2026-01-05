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
  
  // Se o usuário colar algo com +55, removemos para manter o padrão local
  if (r.startsWith("55") && r.length > 11) {
    r = r.substring(2);
  }
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  r = r.substring(0, 11);

  const len = r.length;
  if (len === 0) return "";
  
  // (XX
  if (len <= 2) return `(${r}`;
  
  // (XX) X...
  if (len <= 6) return `(${r.substring(0, 2)}) ${r.substring(2)}`;
  
  // (XX) XXXX-XXXX (Fixo)
  if (len <= 10) {
    return `(${r.substring(0, 2)}) ${r.substring(2, 6)}-${r.substring(6)}`;
  }
  
  // (XX) XXXXX-XXXX (Celular)
  return `(${r.substring(0, 2)}) ${r.substring(2, 7)}-${r.substring(7)}`;
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