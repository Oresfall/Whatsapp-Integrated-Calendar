import { NextResponse } from 'next/server';
import { parseTaskFromText } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Menerima pesan dan nomor dari WA Gateway
    const userMessage = body.message || body.text;
    const senderPhone = body.sender || body.from;

    if (!userMessage || !senderPhone) {
      return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
    }

    // Parse teks ke JSON dengan Gemini
    const parsedData = await parseTaskFromText(userMessage);

    // Simpan ke Supabase
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([
        {
          user_phone: senderPhone,
          title: parsedData.title,
          due_date: parsedData.due_date,
          due_time: parsedData.due_time || '23:59:00',
          category: parsedData.category || 'Tugas',
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      replyMessage: `✅ Tugas "${parsedData.title}" berhasil dicatat untuk tanggal ${parsedData.due_date}!`,
      data
    });

  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}