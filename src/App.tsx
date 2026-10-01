import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./app/layouts/AppLayout";
import { RequireAuth, RequireRole } from "./app/router/RequireAuth";
import { NotFoundPage } from "./app/router/NotFoundPage";
import { PageLoader } from "./shared/components/Skeleton";

const page = <T extends Record<string, React.ComponentType>>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(() => loader().then((m) => ({ default: m[name] as React.ComponentType })));

// Public
const LoginPage = page(() => import("./modules/auth/pages/LoginPage"), "LoginPage");
const RegisterPage = page(() => import("./modules/auth/pages/RegisterPage"), "RegisterPage");

// Shell
const DashboardPage = page(
  () => import("./modules/dashboard/pages/DashboardPage"),
  "DashboardPage",
);
const SettingsPage = page(() => import("./modules/settings/pages/SettingsPage"), "SettingsPage");
const OrganisationPage = page(
  () => import("./modules/organisation/pages/OrganisationPage"),
  "OrganisationPage",
);
const TeamPage = page(() => import("./modules/users/pages/TeamPage"), "TeamPage");
const AdminUsersPage = page(() => import("./modules/users/pages/AdminUsersPage"), "AdminUsersPage");
const AdminInterestPage = page(
  () => import("./modules/interest/pages/AdminInterestPage"),
  "AdminInterestPage",
);
const AuditLogPage = page(() => import("./modules/audit/pages/AuditLogPage"), "AuditLogPage");

// Phase 1 — animal record
const AnimalListPage = page(
  () => import("./modules/animal/pages/AnimalListPage"),
  "AnimalListPage",
);
const AnimalDetailPage = page(
  () => import("./modules/animal/pages/AnimalDetailPage"),
  "AnimalDetailPage",
);
const SharedRecordsPage = page(
  () => import("./modules/animal/pages/SharedRecordsPage"),
  "SharedRecordsPage",
);
const PublicPassportPage = page(
  () => import("./modules/animal/pages/PublicPassportPage"),
  "PublicPassportPage",
);

// Phase 2 — rescue case engine
const IntakeWizardPage = page(
  () => import("./modules/case/pages/IntakeWizardPage"),
  "IntakeWizardPage",
);
const CaseBoardPage = page(() => import("./modules/case/pages/CaseBoardPage"), "CaseBoardPage");
const CaseDetailPage = page(() => import("./modules/case/pages/CaseDetailPage"), "CaseDetailPage");
const FostersPage = page(() => import("./modules/case/pages/FostersPage"), "FostersPage");
const FosterCarePage = page(() => import("./modules/case/pages/FosterCarePage"), "FosterCarePage");

// Phase 3 — adoption
const AdoptBrowsePage = page(
  () => import("./modules/adoption/pages/AdoptBrowsePage"),
  "AdoptBrowsePage",
);
const ListingDetailPage = page(
  () => import("./modules/adoption/pages/ListingDetailPage"),
  "ListingDetailPage",
);
const ApplyPage = page(() => import("./modules/adoption/pages/ApplyPage"), "ApplyPage");
const ApplicationsPage = page(
  () => import("./modules/adoption/pages/ApplicationsPage"),
  "ApplicationsPage",
);
const ApplicationDetailPage = page(
  () => import("./modules/adoption/pages/ApplicationDetailPage"),
  "ApplicationDetailPage",
);

// Phase 4 — community reports
const PublicReportPage = page(
  () => import("./modules/report/pages/PublicReportPage"),
  "PublicReportPage",
);
const TrackReportPage = page(
  () => import("./modules/report/pages/TrackReportPage"),
  "TrackReportPage",
);
const NewReportPage = page(() => import("./modules/report/pages/NewReportPage"), "NewReportPage");
const ReportsPage = page(() => import("./modules/report/pages/ReportsPage"), "ReportsPage");
const ReportDetailPage = page(
  () => import("./modules/report/pages/ReportDetailPage"),
  "ReportDetailPage",
);

// Phase 5 — governance and care network
const VerificationConsolePage = page(
  () => import("./modules/verification/pages/VerificationConsolePage"),
  "VerificationConsolePage",
);
const AdminOrganisationsPage = page(
  () => import("./modules/verification/pages/AdminOrganisationsPage"),
  "AdminOrganisationsPage",
);
const ServicesDirectoryPage = page(
  () => import("./modules/care-network/pages/ServicesDirectoryPage"),
  "ServicesDirectoryPage",
);
const VendorServicesPage = page(
  () => import("./modules/care-network/pages/VendorServicesPage"),
  "VendorServicesPage",
);
const BookingsPage = page(
  () => import("./modules/care-network/pages/BookingsPage"),
  "BookingsPage",
);
const PlansPage = page(() => import("./modules/plans/PlansPage"), "PlansPage");

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/p/:token" element={<PublicPassportPage />} />
        <Route path="/report" element={<PublicReportPage />} />
        <Route path="/track/:token" element={<TrackReportPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route
            path="animals"
            element={
              <RequireRole roles={["admin", "rescue", "owner"]}>
                <AnimalListPage />
              </RequireRole>
            }
          />
          <Route path="animals/:id" element={<AnimalDetailPage />} />
          <Route
            path="shared"
            element={
              <RequireRole roles={["vet"]}>
                <SharedRecordsPage />
              </RequireRole>
            }
          />

          <Route
            path="intake/new"
            element={
              <RequireRole roles={["rescue"]}>
                <IntakeWizardPage />
              </RequireRole>
            }
          />
          <Route
            path="cases"
            element={
              <RequireRole roles={["rescue", "admin"]}>
                <CaseBoardPage />
              </RequireRole>
            }
          />
          <Route
            path="cases/:id"
            element={
              <RequireRole roles={["rescue", "admin"]}>
                <CaseDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="fosters"
            element={
              <RequireRole roles={["rescue"]}>
                <FostersPage />
              </RequireRole>
            }
          />
          <Route
            path="foster"
            element={
              <RequireRole roles={["foster"]}>
                <FosterCarePage />
              </RequireRole>
            }
          />

          <Route path="adopt" element={<AdoptBrowsePage />} />
          <Route path="adopt/:id" element={<ListingDetailPage />} />
          <Route
            path="adopt/:id/apply"
            element={
              <RequireRole roles={["owner"]}>
                <ApplyPage />
              </RequireRole>
            }
          />
          <Route
            path="applications"
            element={
              <RequireRole roles={["owner", "rescue", "admin"]}>
                <ApplicationsPage />
              </RequireRole>
            }
          />
          <Route
            path="applications/:id"
            element={
              <RequireRole roles={["owner", "rescue", "admin"]}>
                <ApplicationDetailPage />
              </RequireRole>
            }
          />

          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/new" element={<NewReportPage />} />
          <Route path="reports/:id" element={<ReportDetailPage />} />

          <Route
            path="admin/verification"
            element={
              <RequireRole roles={["admin"]}>
                <VerificationConsolePage />
              </RequireRole>
            }
          />
          <Route
            path="admin/verification/:id"
            element={
              <RequireRole roles={["admin"]}>
                <VerificationConsolePage />
              </RequireRole>
            }
          />
          <Route
            path="admin/organisations"
            element={
              <RequireRole roles={["admin"]}>
                <AdminOrganisationsPage />
              </RequireRole>
            }
          />
          <Route
            path="services"
            element={
              <RequireRole roles={["owner", "admin"]}>
                <ServicesDirectoryPage />
              </RequireRole>
            }
          />
          <Route
            path="vendor/services"
            element={
              <RequireRole roles={["vendor"]}>
                <VendorServicesPage />
              </RequireRole>
            }
          />
          <Route
            path="bookings"
            element={
              <RequireRole roles={["owner", "vendor", "admin"]}>
                <BookingsPage />
              </RequireRole>
            }
          />
          <Route
            path="plans"
            element={
              <RequireRole roles={["rescue", "vendor", "vet"]}>
                <PlansPage />
              </RequireRole>
            }
          />

          <Route
            path="organisation"
            element={
              <RequireRole roles={["rescue", "vendor"]}>
                <OrganisationPage />
              </RequireRole>
            }
          />
          <Route
            path="team"
            element={
              <RequireRole roles={["rescue", "vendor"]}>
                <TeamPage />
              </RequireRole>
            }
          />
          <Route
            path="audit"
            element={
              <RequireRole roles={["admin", "rescue"]}>
                <AuditLogPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/users"
            element={
              <RequireRole roles={["admin"]}>
                <AdminUsersPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/interest"
            element={
              <RequireRole roles={["admin"]}>
                <AdminInterestPage />
              </RequireRole>
            }
          />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
