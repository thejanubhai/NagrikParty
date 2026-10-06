import type { APIRoute } from "astro";
import { supabase } from "@/lib/supabase";

export const GET: APIRoute = async () => {
  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({
          is_enabled: true,
          legal_status_label: "ECI-verified Current Account: interim party account till registration",
          upi_id: "areynetaji@ybl",
          account_name: "SHEIKH ARSALAN ULLAH CHISHTI",
          bank_name: "Axis Bank",
          account_number: "924020035537387",
          ifsc_code: "UTIB0002912",
          account_type: "Current Account: Election & Donation Account (MLA 2025, ECI affidavit verified; interim party account till registration)",
          qr_image_url: "/images/qrnagrikparty.jpeg",
          payment_instructions: "Scan the UPI QR (areynetaji@ybl) or transfer via IMPS/NEFT to the account beside the QR. Retain UTR for receipt.",
          disclosure_text: "Account holder SHEIKH ARSALAN ULLAH CHISHTI: ECI affidavit-verified Current Account opened during MLA 2025 election. Sole interim party account till registration. Statements released publicly every 6 months. 100% digital, zero cash.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data, error } = await supabase
      .from("donation_configuration")
      .select("is_enabled, legal_status_label, upi_id, account_name, bank_name, account_number, ifsc_code, account_type, qr_image_url, payment_instructions, disclosure_text")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return new Response(
        JSON.stringify({
          is_enabled: true,
          legal_status_label: "ECI-verified Current Account: interim party account till registration",
          upi_id: "areynetaji@ybl",
          account_name: "SHEIKH ARSALAN ULLAH CHISHTI",
          bank_name: "Axis Bank",
          account_number: "924020035537387",
          ifsc_code: "UTIB0002912",
          account_type: "Current Account: Election & Donation Account (MLA 2025, ECI affidavit verified; interim party account till registration)",
          qr_image_url: "/images/qrnagrikparty.jpeg",
          payment_instructions: "Scan the UPI QR (areynetaji@ybl) or transfer via IMPS/NEFT to the account beside the QR. Retain UTR for receipt.",
          disclosure_text: "Account holder SHEIKH ARSALAN ULLAH CHISHTI: ECI affidavit-verified Current Account opened during MLA 2025 election. Sole interim party account till registration. Statements released publicly every 6 months. 100% digital, zero cash.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Live fallback: never return a stale/empty UPI or QR. The verified
    // ECI Political Current Account UPI + app-bundled QR are the source of truth.
    if (!data.upi_id) data.upi_id = "areynetaji@ybl";
    if (!data.qr_image_url) data.qr_image_url = "/images/qrnagrikparty.jpeg";

    const upi_payload = data.upi_id
      ? `upi://pay?pa=${encodeURIComponent(data.upi_id)}&pn=${encodeURIComponent(data.account_name || "Nagrik Party")}&cu=INR`
      : null;

    return new Response(JSON.stringify({ ...data, upi_payload }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("Error fetching donation configuration:", err);
    return new Response(JSON.stringify({ is_enabled: false }), { status: 200 });
  }
};
