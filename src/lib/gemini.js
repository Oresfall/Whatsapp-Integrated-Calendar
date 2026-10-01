import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const taskSchema = {
  type: SchemaType.OBJECT,
  properties: {
    action: {
      type: SchemaType.STRING,
      description: "Tentukan aksi yang diinginkan pengguna. Pilih salah satu dari: ADD, LIST, UPDATE, atau DELETE",
    },
    title: { 
      type: SchemaType.STRING, 
      description: "Nama atau deskripsi tugas/acara (digunakan untuk ADD atau UPDATE)" 
    },
    target_identifier: {
      type: SchemaType.STRING,
      description: "Nama tugas/kata kunci yang ingin diubah atau dihapus (digunakan untuk UPDATE atau DELETE)"
    },
    due_date: { 
      type: SchemaType.STRING, 
      description: "Tanggal tenggat dalam format YYYY-MM-DD" 
    },
    due_time: { 
      type: SchemaType.STRING, 
      description: "Waktu/jam tenggat dalam format HH:mm (24 jam), default '23:59' jika tidak disebutkan" 
    },
    category: { 
      type: SchemaType.STRING, 
      description: "Kategori: Tugas, Rapat, Pengingat, atau Acara" 
    }
  },
  required: ["action"],
};

export async function parseTaskFromText(textMessage) {
  const today = new Date().toISOString().split('T')[0];

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
        Analisislah teks instruksi WhatsApp pengguna dan tentukan action-nya:
        - ADD: Jika pengguna ingin menambah pengingat/tugas baru (contoh: "tambah tugas SPK hari ini jam 23.59").
        - LIST: Jika pengguna ingin melihat daftar pengingat (contoh: "tampilkan daftar pengingat", "lihat jadwal").
        - UPDATE: Jika pengguna ingin mengubah pengingat yang ada (contoh: "ubah tugas SPK jadi tanggal 12").
        - DELETE: Jika pengguna ingin menghapus pengingat (contoh: "hapus tugas SPK").`
      });

      const result = await model.generateContent(textMessage);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.warn(`Model ${modelName} gagal (${error.message}), mencoba fallback berikutnya...`);
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        throw error;
      }
    }
  }
}

export const parseIntentFromText = parseTaskFromText;