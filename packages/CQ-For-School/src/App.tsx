import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Survey from "@/pages/Survey";
import FrictionDiagnosisSurvey from "@/pages/FrictionDiagnosisSurvey";
import Settings from "@/pages/Settings";
import TeacherDashboard from "@/pages/TeacherDashboard";
import Admin from "@/pages/Admin";
import AdminDashboard from "@/pages/AdminDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import BenchmarkingDashboard from "@/pages/BenchmarkingDashboard";
import JoinSchool from "@/pages/JoinSchool";
import AdminSchools from "@/pages/AdminSchools";
import CulturalFingerprint from "@/pages/CulturalFingerprint";
import TurnoverDashboard from "@/pages/TurnoverDashboard";
import EmailDashboard from "@/pages/EmailDashboard";
import ContentLibrary from "@/pages/ContentLibrary";
import WebinarsImpact from "@/pages/WebinarsImpact";
import FrictionCauses from "@/pages/FrictionCauses";
import CQNavigator from "@/pages/CQNavigator";
import StaffWellness from "@/pages/StaffWellness";
import LeadershipClarity from "@/pages/LeadershipClarity";
import NewStaffIntegration from "@/pages/NewStaffIntegration";
import SurveyHub from "@/pages/SurveyHub";
import LeadershipCoaching from "@/pages/LeadershipCoaching";
import SessionsCPD from "@/pages/SessionsCPD";
import QuarterlyActionPlan from "@/pages/QuarterlyActionPlan";
import QuarterlyReports from "@/pages/QuarterlyReports";
import TurnoverBenchmarks from "@/pages/TurnoverBenchmarks";
import Unsubscribe from "@/pages/Unsubscribe";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join/:schoolId" element={<JoinSchool />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />

      {/* Protected: survey */}
      <Route path="/survey" element={<ProtectedRoute><AppLayout><Survey /></AppLayout></ProtectedRoute>} />
      <Route path="/survey/diagnosis" element={<ProtectedRoute><AppLayout><FrictionDiagnosisSurvey /></AppLayout></ProtectedRoute>} />

      {/* Protected: all other dashboard routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<Admin />} />
                <Route path="/quarterly-action-plan" element={<QuarterlyActionPlan />} />
                <Route path="/quarterly-reports" element={<QuarterlyReports />} />

                <Route path="/analytics/cultural-preferences" element={<Navigate to="/analytics/cultural-fingerprint/group-comparison" replace />} />
                <Route path="/analytics/cultural-fingerprint" element={<Navigate to="/analytics/cultural-fingerprint/group-comparison" replace />} />
                <Route path="/analytics/cultural-fingerprint/:tab" element={<CulturalFingerprint />} />
                <Route path="/analytics/cq-navigator" element={<Navigate to="/analytics/cq-navigator/overview" replace />} />
                <Route path="/analytics/cq-navigator/:tab" element={<CQNavigator />} />
                <Route path="/analytics/turnover" element={<TurnoverDashboard />} />
                <Route path="/analytics/benchmarking" element={<BenchmarkingDashboard />} />
                <Route path="/analytics/turnover-benchmarks" element={<TurnoverBenchmarks />} />

                <Route path="/staff/issues" element={<AdminDashboard />} />
                <Route path="/staff/friction" element={<FrictionCauses />} />
                <Route path="/staff/wellness" element={<StaffWellness />} />
                <Route path="/staff/leadership-clarity" element={<LeadershipClarity />} />
                <Route path="/staff/new-staff-integration" element={<NewStaffIntegration />} />
                <Route path="/survey-hub" element={<Navigate to="/survey-hub/calendar" replace />} />
                <Route path="/survey-hub/:tab" element={<SurveyHub />} />

                <Route path="/recommendations/webinar-impact" element={<WebinarsImpact />} />
                <Route path="/recommendations/coaching" element={<LeadershipCoaching />} />

                <Route path="/learning/library" element={<ContentLibrary />} />
                <Route path="/learning/sessions" element={<Navigate to="/learning/sessions/calendar" replace />} />
                <Route path="/learning/sessions/:tab" element={<SessionsCPD />} />

                <Route path="/admin/surveys" element={<Survey />} />
                <Route path="/admin/email-monitor" element={<EmailDashboard />} />
                <Route path="/admin/schools" element={<AdminSchools />} />

                <Route path="/settings" element={<Settings />} />
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="/parent" element={<ParentDashboard />} />

                <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                <Route path="/cultural-fingerprint" element={<Navigate to="/analytics/cultural-fingerprint" replace />} />
                <Route path="/workstyle-comparator" element={<Navigate to="/analytics/cultural-preferences" replace />} />
                <Route path="/workstyle-gaps" element={<Navigate to="/analytics/cultural-preferences" replace />} />
                <Route path="/workstyle-group-breakdown" element={<Navigate to="/analytics/cultural-preferences" replace />} />
                <Route path="/cq-growth" element={<Navigate to="/analytics/cq-navigator/overview" replace />} />
                <Route path="/cq-navigator-trends" element={<Navigate to="/analytics/cq-navigator/overview" replace />} />
                <Route path="/cq-wins" element={<Navigate to="/analytics/cq-navigator/overview" replace />} />
                <Route path="/cq-concerns" element={<Navigate to="/analytics/cq-navigator/overview" replace />} />
                <Route path="/turnover" element={<Navigate to="/analytics/turnover" replace />} />
                <Route path="/benchmarking" element={<Navigate to="/analytics/benchmarking" replace />} />
                <Route path="/issue-tracking" element={<Navigate to="/staff/issues" replace />} />
                <Route path="/friction-causes" element={<Navigate to="/staff/friction" replace />} />
                <Route path="/cultural-friction" element={<Navigate to="/staff/friction" replace />} />
                <Route path="/staff-wellness" element={<Navigate to="/staff/wellness" replace />} />
                <Route path="/tenure" element={<Navigate to="/staff/workforce" replace />} />
                <Route path="/at-risk" element={<Navigate to="/staff/workforce" replace />} />
                <Route path="/department" element={<Navigate to="/staff/workforce" replace />} />
                <Route path="/school-level" element={<Navigate to="/staff/workforce" replace />} />
                <Route path="/admin-recommendations" element={<Navigate to="/recommendations/interventions" replace />} />
                <Route path="/leadership-coaching" element={<Navigate to="/recommendations/coaching" replace />} />
                <Route path="/accreditation/content" element={<Navigate to="/learning/library" replace />} />
                <Route path="/accreditation/sessions" element={<Navigate to="/learning/sessions/calendar" replace />} />
                <Route path="/accreditation/attendance" element={<Navigate to="/learning/sessions/attendance" replace />} />
                <Route path="/accreditation/certificates" element={<Navigate to="/learning/sessions/certificates" replace />} />
                <Route path="/schools" element={<Navigate to="/admin/schools" replace />} />
                <Route path="/emails" element={<Navigate to="/admin/email-monitor" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
