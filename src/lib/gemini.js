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

  // Menggunakan urutan model aktif dari keluarga Gemini 3.x
  const modelsToTry = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ];

  for (const modelName of modelsToTry) {
    try {
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
      return JSON.parse(result.response.text());
    } catch (error) {
      console.warn(`Model ${modelName} gagal (${error.message}), mencoba model cadangan berikutnya...`);
      // Jika sudah di iterasi terakhir dan tetap gagal, lemparkan error
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        throw error;
      }
    }
  }
}

export const parseIntentFromText = parseTaskFromText;