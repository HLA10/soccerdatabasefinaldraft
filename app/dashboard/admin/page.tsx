"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);

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

    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, role } : u
      )
    );
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {users.map((user) => (
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

