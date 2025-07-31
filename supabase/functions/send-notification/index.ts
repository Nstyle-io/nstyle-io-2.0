import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface NotificationRequest {
  type: "appointment_confirmation" | "appointment_reminder" | "appointment_cancelled";
  recipient_email: string;
  recipient_name: string;
  appointment_data: {
    salon_name: string;
    service_name: string;
    appointment_date: string;
    start_time: string;
    salon_address?: string;
    salon_phone?: string;
  };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { type, recipient_email, recipient_name, appointment_data }: NotificationRequest = await req.json();

    let subject: string;
    let htmlContent: string;

    switch (type) {
      case "appointment_confirmation":
        subject = `Appointment Confirmed at ${appointment_data.salon_name}`;
        htmlContent = `
          <h1>Appointment Confirmed!</h1>
          <p>Hi ${recipient_name},</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <ul>
            <li><strong>Salon:</strong> ${appointment_data.salon_name}</li>
            <li><strong>Service:</strong> ${appointment_data.service_name}</li>
            <li><strong>Date:</strong> ${appointment_data.appointment_date}</li>
            <li><strong>Time:</strong> ${appointment_data.start_time}</li>
            ${appointment_data.salon_address ? `<li><strong>Address:</strong> ${appointment_data.salon_address}</li>` : ''}
            ${appointment_data.salon_phone ? `<li><strong>Phone:</strong> ${appointment_data.salon_phone}</li>` : ''}
          </ul>
          <p>We look forward to seeing you!</p>
          <p>Best regards,<br>${appointment_data.salon_name}</p>
        `;
        break;

      case "appointment_reminder":
        subject = `Reminder: Your appointment tomorrow at ${appointment_data.salon_name}`;
        htmlContent = `
          <h1>Appointment Reminder</h1>
          <p>Hi ${recipient_name},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          <ul>
            <li><strong>Salon:</strong> ${appointment_data.salon_name}</li>
            <li><strong>Service:</strong> ${appointment_data.service_name}</li>
            <li><strong>Date:</strong> ${appointment_data.appointment_date}</li>
            <li><strong>Time:</strong> ${appointment_data.start_time}</li>
            ${appointment_data.salon_address ? `<li><strong>Address:</strong> ${appointment_data.salon_address}</li>` : ''}
            ${appointment_data.salon_phone ? `<li><strong>Phone:</strong> ${appointment_data.salon_phone}</li>` : ''}
          </ul>
          <p>Please arrive 10 minutes early. If you need to reschedule, please contact us as soon as possible.</p>
          <p>Best regards,<br>${appointment_data.salon_name}</p>
        `;
        break;

      case "appointment_cancelled":
        subject = `Appointment Cancelled at ${appointment_data.salon_name}`;
        htmlContent = `
          <h1>Appointment Cancelled</h1>
          <p>Hi ${recipient_name},</p>
          <p>Your appointment has been cancelled:</p>
          <ul>
            <li><strong>Salon:</strong> ${appointment_data.salon_name}</li>
            <li><strong>Service:</strong> ${appointment_data.service_name}</li>
            <li><strong>Date:</strong> ${appointment_data.appointment_date}</li>
            <li><strong>Time:</strong> ${appointment_data.start_time}</li>
          </ul>
          <p>If you would like to reschedule, please contact us or book a new appointment through our website.</p>
          <p>Best regards,<br>${appointment_data.salon_name}</p>
        `;
        break;

      default:
        throw new Error("Invalid notification type");
    }

    const emailResponse = await resend.emails.send({
      from: "NailApp <noreply@nailapp.com>",
      to: [recipient_email],
      subject,
      html: htmlContent,
    });

    console.log(`${type} notification sent successfully to ${recipient_email}:`, emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});