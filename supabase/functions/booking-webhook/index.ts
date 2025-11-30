import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Parse Data
        // We expect a clean JSON object from our Google Apps Script
        const payload = await req.json()

        console.log("Received Booking Payload:", JSON.stringify(payload))

        // 2. Validate & Map
        // The Google Script will send keys matching our DB columns to make it easy
        const bookingData = {
            customer_name: payload.customer_name,
            contact_number: payload.contact_number,
            booking_date: payload.booking_date, // YYYY-MM-DD
            booking_time: payload.booking_time, // HH:mm
            pax: parseInt(payload.pax),
            type: payload.type || 'RESERVATION',
            status: 'PENDING', // Google Forms are usually pending until confirmed
            notes: payload.notes
        }

        // 3. Insert into Supabase
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])

        if (error) throw error

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
