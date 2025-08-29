import React, { useState, useEffect, ComponentType } from "react";
import { supabase } from "./supabaseClient";

export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.role || null;
}

export function withRole<P>(Component: ComponentType<P>, allowedRoles: string[]) {
  return function RoleProtected(props: React.PropsWithChildren<P>) {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      getUserRole().then(r => {
        setRole(r);
        setLoading(false);
      });
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!role || !allowedRoles.includes(role)) return <div>Access denied.</div>;
    return <Component {...props} />;
  };
}
