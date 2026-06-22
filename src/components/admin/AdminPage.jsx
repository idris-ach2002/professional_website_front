import useAdminController from "./useAdminController";
import AdminLayout from "./AdminLayout";

export default function AdminPage() {
  const controller = useAdminController();
  return <AdminLayout controller={controller} />;
}
