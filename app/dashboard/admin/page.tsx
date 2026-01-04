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
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage user roles and permissions</p>
      </div>

      {users.length === 0 ? (
        <Card className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto">
            👤
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">No users found</h3>
          <p className="text-gray-600">Users will appear here once they sign up.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user, index) => (
            <Card key={user.id} className="max-w-2xl animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900">{user.name || "No name"}</p>
                    <p className="text-gray-600 text-sm">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current role: <span className="font-semibold text-blue-600">{user.role}</span>
                    </p>
                  </div>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-gray-900 hover:border-gray-300"
                >
                  <option value="SCOUT">SCOUT</option>
                  <option value="COACH">COACH</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

