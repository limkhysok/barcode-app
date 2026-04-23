import api from "./api";
import { User } from "../types/auth.types";

export const getStaffUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>("/api/v1/users/boss/staff-users/");
  return data;
};
