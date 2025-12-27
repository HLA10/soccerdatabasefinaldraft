"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  async function updateRole(userId: string, role: string) {
    await fetch("/api/admin/users/role", {
      method: "POST",
      body: JSON.stringify({ targetUserId: userId, role }),
    });

    setUsers(
      users.map((u: any) =>
        u.id === userId ? { ...u, role } : u
      )
    );
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {users.map((user: any) => (
        <div key={user.id} className="border p-4 mb-4">
          <p><strong>{user.name}</strong> ({user.email})</p>
          <p>Current role: {user.role}</p>

          <select
            value={user.role}
            onChange={(e) => updateRole(user.id, e.target.value)}
            className="border p-2 mt-2"
          >
            <option value="SCOUT">SCOUT</option>
            <option value="COACH">COACH</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      ))}
    </div>
  );
}

