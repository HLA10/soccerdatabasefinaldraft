"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function updateRole(userId: string, role: string) {
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: userId, role }),
      });

      if (res.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === userId ? { ...u, role } : u
          )
        );
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage user roles and permissions</p>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="max-w-2xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{user.name || "No name"}</p>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Current role: <span className="font-medium">{user.role}</span>
                </p>
              </div>
              <select
                value={user.role}
                onChange={(e) => updateRole(user.id, e.target.value)}
                className="border rounded px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="SCOUT">SCOUT</option>
                <option value="COACH">COACH</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

