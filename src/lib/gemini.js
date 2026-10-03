import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

  const modelsToTry = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Mencoba memproses teks dengan model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: taskSchema,
        },
        systemInstruction: `Kamu adalah asisten pengenal jadwal kalender. 
        Hari ini adalah tanggal: ${today}. 
        Ekstrak teks WhatsApp dari pengguna menjadi JSON jadwal yang akurat.`
      });

      const result = await model.generateContent(textMessage);
      const responseText = result.response.text();
      
      // Berhasil diekstrak, kembalikan JSON
      return JSON.parse(responseText);
    } catch (err) {
      console.warn(`Model ${modelName} gagal dipanggil (${err?.status || err?.message}), mencoba model berikutnya...`);
      lastError = err;
    }
  }

  // Jika semua model dalam list gagal
  throw new Error(`Semua model Gemini gagal memproses teks: ${lastError?.message || lastError}`);
}

// Ekspor alias agar route webhook bisa memanggil parseIntentFromText
export const parseIntentFromText = parseTaskFromText;