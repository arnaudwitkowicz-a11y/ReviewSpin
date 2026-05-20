import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { name, email, sentiment, reward_label, reward_code, qr_token } = await request.json()

    // Find the QR code and restaurant
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('id, restaurant_id')
      .eq('token', qr_token || 'rest_001_t7')
      .single()

    if (!qrCode) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 })
    }

    // Save the scan session
    const { data: session } = await supabase
      .from('scan_sessions')
      .insert({
        qr_code_id: qrCode.id,
        restaurant_id: qrCode.restaurant_id,
        customer_name: name,
        customer_email: email,
        sentiment: sentiment,
        spin_completed: true,
      })
      .select()
      .single()

    // Save the reward code if they won
    if (reward_label && reward_code && !reward_label.includes('Luck')) {
      await supabase.from('reward_codes').insert({
        scan_session_id: session.id,
        restaurant_id: qrCode.restaurant_id,
        reward_label: reward_label,
        reward_type: 'item',
        code: reward_code,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    return NextResponse.json({ success: true, session_id: session.id })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}