import { sampleContentBlocks } from "./sampleContentBlocks";

const userData: {
  slug: { current: string };
  name: string;
  age: number;
  role: RoleType;
  nicknames?: string[];
  bio?: unknown;
}[] = [
  {
    slug: { current: "john" },
    name: "John",
    age: 20,
    role: "guest",
    nicknames: ["Johnny", "J Boi", "Dat Boi Doe"],
  },
  { slug: { current: "jane" }, name: "Jane", age: 30, role: "admin" },
];

const users = userData.map((user) => ({
  _type: "user",
  _id: `user.${user.name}`,
  ...user,
  role: {
    _type: "reference",
    _ref: `role.${user.role}`,
  },
  bio: sampleContentBlocks,
}));

type RoleType = "guest" | "admin";
const roles: { _type: "role"; title: string; _id: `role.${RoleType}` }[] = [
  { _type: "role", title: "guest", _id: "role.guest" },
  { _type: "role", title: "admin", _id: "role.admin" },
];

export const userDataset = [...users, ...roles];
