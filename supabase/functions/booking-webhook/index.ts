import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { customer_name, contact_number, booking_date, booking_time, pax, type, notes } = await req.json()

        // Basic validation
        if (!customer_name || !contact_number || !booking_date || !type) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    customer_name,
                    contact_number,
                    booking_date,
                    booking_time,
                    pax: parseInt(pax) || 0,
                    type: type.toUpperCase(), // Ensure uppercase for enum check
                    notes,
                    status: 'PENDING'
                }
            ])
            .select()

        if (error) throw error

        return new Response(
            JSON.stringify({ message: 'Booking created successfully', data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
