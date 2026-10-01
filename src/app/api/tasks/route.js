import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tasks: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}