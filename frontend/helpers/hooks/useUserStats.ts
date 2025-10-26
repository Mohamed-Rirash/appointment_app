// import { User } from "@/app/(dashboard)/members/_components/UsersTableClient";

// export interface UserStats {
//   total: number;
//   active: number;
//   inactive: number;
//   verified: number;
//   unverified: number;
//   systemUsers: number;
//   regularUsers: number;
//   roles: Record<string, number>;
// }

// export function useUserStats(users: User[]): UserStats {
//   // Initialize counters
//   let active = 0;
//   let verified = 0;
//   let systemUsers = 0;
//   const roleCounts: Record<string, number> = {};

//   // Process each user
//   users.forEach((user) => {
//     if (user.is_active) active++;
//     if (user.is_verified) verified++;
//     if (user.is_system_user) systemUsers++;

//     // Count roles (handle multiple roles)
//     user.roles.forEach((role) => {
//       roleCounts[role] = (roleCounts[role] || 0) + 1;
//     });
//   });

//   return {
//     total: users.length,
//     active,
//     inactive: users.length - active,
//     verified,
//     unverified: users.length - verified,
//     systemUsers,
//     regularUsers: users.length - systemUsers,
//     roles: roleCounts,
//   };
// }
