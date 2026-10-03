import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    // Standardisasi format nomor HP (misal 0812... -> 62812...)
    let formattedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    // 1. Generate 6 digit OTP acak
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Set waktu kadaluarsa 5 menit dari sekarang
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 3. Hapus OTP lama milik nomor ini jika ada
    await supabaseAdmin.from('otps').delete().eq('phone', formattedPhone);

    // 4. Simpan OTP baru ke Supabase
    const { error: dbError } = await supabaseAdmin.from('otps').insert([
      {
        phone: formattedPhone,
        otp_code: otpCode,
        expires_at: expiresAt,
      },
    ]);

    if (dbError) throw dbError;

    // 5. Kirim OTP via Fonnte API
    const fonnteToken = process.env.FONNTE_TOKEN;
    const message = `Kode verifikasi (OTP) login Anda adalah: *${otpCode}*\n\nKode ini berlaku selama 5 menit. JANGAN BERIKAN KODE INI KEPADA SIAPAPUN.`;

    const fonnteResponse = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
      }),
    });

    const fonnteResult = await fonnteResponse.json();

    if (!fonnteResult.status) {
      return NextResponse.json({ error: 'Gagal mengirim WhatsApp OTP via Fonnte' }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Kode OTP berhasil dikirim via WhatsApp',
      phone: formattedPhone 
    });

  } catch (err) {
    console.error('Send OTP Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}