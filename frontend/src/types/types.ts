export type User = {
  id: number;
  login: string;
  status: string;
  nickname: string;
  avatarPath: string;
};

export type UserStatus = {
  id: number;
  status: string;
};