import { NextResponse } from 'next/server';
import { parseIntentFromText } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function untuk mengirim balasan pesan WA via Fonnte API
async function sendWhatsAppReply(targetPhone, messageText) {
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (!fonnteToken) return;

  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': fonnteToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: targetPhone,
      message: messageText,
    }),
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Payload dari Fonnte
    const rawMessage = body.message || body.text || "";
    const senderPhone = body.sender || body.from;

    if (!rawMessage || !senderPhone) {
      return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
    }

    const trimmedMessage = rawMessage.trim();
    const PREFIX = "!pengingat";

    // 1. Cek apakah pesan diawali dengan prefix "!pengingat" (case-insensitive)
    if (!trimmedMessage.toLowerCase().startsWith(PREFIX)) {
      // Abaikan pesan biasa (chat pribadi)
      return NextResponse.json({ status: 'ignored', reason: 'Pesan tanpa prefix' });
    }

    // 2. Potong prefix dari isi pesan
    const userPrompt = trimmedMessage.slice(PREFIX.length).trim();

    if (!userPrompt) {
      // Jika pengguna hanya mengetik "!pengingat" tanpa isi
      const helpText = `Format Penggunaan:\n- !pengingat Tambah tugas MPM besok jam 8 malam\n- !pengingat Tampilkan daftar pengingat\n- !pengingat Ubah tugas MPM jadi tanggal 12\n- !pengingat Hapus tugas MPM`;
      await sendWhatsAppReply(senderPhone, helpText);
      return NextResponse.json({ status: 'success', replyMessage: helpText });
    }

    // 3. Panggil AI untuk menentukan Intent/Action dari instruksi
    const parsed = await parseIntentFromText(userPrompt);

    let replyText = "";

    // 4. Tentukan logika berdasarkan perintah hasil keputusan AI
    const action = parsed.action || 'ADD';
    switch (action) {
      case 'ADD': {
        const { data, error } = await supabaseAdmin
          .from('tasks')
          .insert([
            {
              user_phone: senderPhone,
              title: parsed.title || 'Tugas Tanpa Judul',
              due_date: parsed.due_date,
              due_time: parsed.due_time || '23:59:00',
              category: parsed.category || 'Tugas',
            }
          ])
          .select();

        if (error) throw error;
        replyText = `[Pengingat Berhasil Ditambahkan]\nJudul: ${parsed.title}\nTanggal: ${parsed.due_date}\nWaktu: ${parsed.due_time || '23:59'}`;
        break;
      }

      case 'LIST': {
        const { data, error } = await supabaseAdmin
          .from('tasks')
          .select('*')
          .eq('user_phone', senderPhone)
          .eq('is_completed', false)
          .order('due_date', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          replyText = `Daftar Pengingat:\nBelum ada pengingat atau jadwal mendatang.`;
        } else {
          let listMessage = `Daftar Pengingat Kamu:\n\n`;
          data.forEach((task, index) => {
            listMessage += `${index + 1}. ${task.title}\n   Tanggal: ${task.due_date} | Jam: ${task.due_time}\n`;
          });
          replyText = listMessage;
        }
        break;
      }

      case 'UPDATE': {
        const target = parsed.target_identifier || parsed.title;
        
        const { data, error } = await supabaseAdmin
          .from('tasks')
          .update({
            title: parsed.title,
            due_date: parsed.due_date,
            due_time: parsed.due_time || '23:59:00',
          })
          .eq('user_phone', senderPhone)
          .ilike('title', `%${target}%`)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          replyText = `[Pengingat Berhasil Diperbarui]\nJudul Baru: ${parsed.title}\nTanggal: ${parsed.due_date}`;
        } else {
          replyText = `Pengingat dengan kata kunci "${target}" tidak ditemukan untuk diubah.`;
        }
        break;
      }

      case 'DELETE': {
        const target = parsed.target_identifier || parsed.title;

        const { data, error } = await supabaseAdmin
          .from('tasks')
          .delete()
          .eq('user_phone', senderPhone)
          .ilike('title', `%${target}%`)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          replyText = `[Pengingat Berhasil Dihapus]\nJudul: ${data[0].title}`;
        } else {
          replyText = `Pengingat dengan kata kunci "${target}" tidak ditemukan untuk dihapus.`;
        }
        break;
      }

      default:
        replyText = `Maaf, perintah tidak dikenali. Coba ketik "!pengingat" untuk melihat bantuan.`;
    }

    // 5. Kirim balasan via Fonnte
    await sendWhatsAppReply(senderPhone, replyText);

    return NextResponse.json({
      status: 'success',
      action: parsed.action,
      replyMessage: replyText
    });

  } catch (err) {
    console.error('Webhook Handling Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}