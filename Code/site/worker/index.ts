import { setRequestEnv } from "./env";

import calendarStatus from "../netlify/functions/calendar-status";
import dayContent from "../netlify/functions/day-content";
import verifyAccess from "../netlify/functions/verify-access";
import recoverAccess from "../netlify/functions/recover-access";
import checkout from "../netlify/functions/checkout";
import paypalCapture from "../netlify/functions/paypal-capture";
import paypalCreate from "../netlify/functions/paypal-create";
import paypalWebhook from "../netlify/functions/paypal-webhook";
import processEmails from "../netlify/functions/process-emails";
import adminDashboard from "../netlify/functions/admin-dashboard";
import adminOrders from "../netlify/functions/admin-orders";
import adminRecipes from "../netlify/functions/admin-recipes";
import adminCalendar from "../netlify/functions/admin-calendar";
import adminCustomers from "../netlify/functions/admin-customers";
import adminSettings from "../netlify/functions/admin-settings";

type Handler = (req: Request) => Promise<Response>;

const routes: Record<string, Handler> = {
  "calendar-status": calendarStatus,
  "day-content": dayContent,
  "verify-access": verifyAccess,
  "recover-access": recoverAccess,
  checkout,
  "paypal-capture": paypalCapture,
  "paypal-create": paypalCreate,
  "paypal-webhook": paypalWebhook,
  "process-emails": processEmails,
  "admin-dashboard": adminDashboard,
  "admin-orders": adminOrders,
  "admin-recipes": adminRecipes,
  "admin-calendar": adminCalendar,
  "admin-customers": adminCustomers,
  "admin-settings": adminSettings,
};

export interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  PUBLIC_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_FROM_NAME?: string;
  CRON_SECRET?: string;
  CALENDAR_TIMEZONE?: string;
  CALENDAR_OPEN_HOUR?: string;
  CALENDAR_YEAR?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENVIRONMENT?: string;
  PAYPAL_WEBHOOK_ID?: string;
  ATH_MOVIL_PUBLIC_TOKEN?: string;
  ATH_MOVIL_PRIVATE_TOKEN?: string;
  ATH_MOVIL_ENVIRONMENT?: string;
  ADMIN_SECRET?: string;
  [key: string]: string | undefined;
}

const worker = {
  async fetch(request: Request, cfEnv: Env): Promise<Response> {
    setRequestEnv(cfEnv as Record<string, string | undefined>);

    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      const name = path.replace("/api/", "").replace(/\/$/, "");
      const handler = routes[name];
      if (handler) {
        return handler(request);
      }
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 404 });
  },
};

export default worker;
