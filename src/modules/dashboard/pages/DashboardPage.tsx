import { lazy } from "react";
import { useAppSelector } from "@/app/hooks";

const RescueHome = lazy(() =>
  import("../components/RescueHome").then((m) => ({ default: m.RescueHome })),
);
const OwnerHome = lazy(() =>
  import("../components/OwnerHome").then((m) => ({ default: m.OwnerHome })),
);
const AdminHome = lazy(() =>
  import("../components/AdminHome").then((m) => ({ default: m.AdminHome })),
);
const FosterHome = lazy(() =>
  import("../components/FosterHome").then((m) => ({ default: m.FosterHome })),
);
const VendorHome = lazy(() =>
  import("../components/VendorHome").then((m) => ({ default: m.VendorHome })),
);
const VetHome = lazy(() => import("../components/VetHome").then((m) => ({ default: m.VetHome })));

/**
 * Role-aware home: the same building blocks, arranged for what each person
 * does first thing (blueprint: "distinct role-based home screens").
 */
export function DashboardPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  switch (role) {
    case "rescue":
      return <RescueHome />;
    case "admin":
      return <AdminHome />;
    case "foster":
      return <FosterHome />;
    case "vendor":
      return <VendorHome />;
    case "vet":
      return <VetHome />;
    default:
      return <OwnerHome />;
  }
}
