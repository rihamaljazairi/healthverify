import AdminLayout from "../layout/AdminLayout";

export default function NurseDashboard() {
  return (
    <AdminLayout title="Nurse Dashboard">

      <h3>Assigned Tasks</h3>

      <ul>
        <li>Check patient vitals</li>
        <li>Administer medication</li>
        <li>Update records</li>
      </ul>

    </AdminLayout>
  );
}