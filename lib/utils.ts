
export function formatDate(dateString: string) {
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
  let r = value.replace(/\D/g, "");
  if (r.startsWith("55") && r.length > 11) {
    r = r.substring(2);
  }
  r = r.substring(0, 11);
  const len = r.length;
  if (len === 0) return "";
  if (len <= 2) return `(${r}`;
  if (len <= 6) return `(${r.substring(0, 2)}) ${r.substring(2)}`;
  if (len <= 10) {
    return `(${r.substring(0, 2)}) ${r.substring(2, 6)}-${r.substring(6)}`;
  }
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
  const content = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}
