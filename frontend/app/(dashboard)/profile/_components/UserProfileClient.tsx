"use client";

import { UserProfileDisplay } from "./user-profile-display";
import { PasswordChangeForm } from "./password-change-form";

interface UserProfileClientProps {
  user: {
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string,
    roles: string[];
    access_token: string;
  };
}

export default function UserProfileClient({ user }: UserProfileClientProps) {
  return (
    <div className="space-y-8">
      <UserProfileDisplay user={user} />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <PasswordChangeForm
            token={user.access_token}
            user={{
              is_active: user.is_active,
              is_verified: user.is_verified
            }}
          />
        </div>
      </div>
    </div>
  );
}