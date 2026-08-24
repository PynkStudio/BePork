import { PlatformCockpitAlerts } from "@/components/admin/platform/platform-cockpit-alerts";

export default function MenuarySupportoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Supporto</h1>
        <p className="pynk-admin-page-subtitle">Ticket e segnalazioni attive</p>
      </div>
      <PlatformCockpitAlerts />
    </div>
  );
}
