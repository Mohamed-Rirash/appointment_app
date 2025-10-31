import { getSession } from "./actions/getsession";

export default async function getUserRole() {
  const session = await getSession();
  const role = session?.user;
  return role.roles[0];
}
