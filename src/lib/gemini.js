import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const taskSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { 
      type: SchemaType.STRING, 
      description: "Nama atau deskripsi tugas/acara" 
    },
    due_date: { 
      type: SchemaType.STRING, 
      description: "Tanggal tenggat dalam format YYYY-MM-DD" 
    },
    due_time: { 
      type: SchemaType.STRING, 
      description: "Waktu/jam tenggat dalam format HH:mm (24 jam), default '23:59' jika tidak ada" 
    },
    category: { 
      type: SchemaType.STRING, 
      description: "Kategori: Tugas, Rapat, Pengingat, atau Acara" 
    }
  },
  required: ["title", "due_date"],
};

export async function parseTaskFromText(textMessage) {
  const today = new Date().toISOString().split('T')[0];

  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash", // Menggunakan model yang direkomendasikan log Vercel
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: taskSchema,
    },
    systemInstruction: `Kamu adalah asisten pengenal jadwal kalender. 
    Hari ini adalah tanggal: ${today}. 
    Ekstrak teks WhatsApp dari pengguna menjadi JSON jadwal yang akurat.`
  });

  const result = await model.generateContent(textMessage);
  return JSON.parse(result.response.text());
}

export const parseIntentFromText = parseTaskFromText;