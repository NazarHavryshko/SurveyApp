export interface DictOption {
  id: number;
  name: string;
}

export interface RegisterRequest {
  deviceKey: string;
  nickname: string;
  password: string;
  gender: number;
  birthYear: number;
  occupationId: number;
  regionId: number;
  hobbyId: number;
}

export interface LoginRequest {
  nickname: string;
  password: string;
}

export interface AuthUserResponse {
  userId: string;
  userType: number;
  nickname: string;
  gender: number;
  birthYear: number;
  regionId: number;
  regionName?: string;
  occupationId: number;
  occupationName?: string;
  hobbyId: number;
  hobbyName?: string;
  answersCount?: number;
  availableQuestionTokens?: number;
  token?: string;
  accessToken?: string;
}

export interface UpdateProfileRequest {
  nickname: string;
  gender: number;
  birthYear: number;
  occupationId: number;
  regionId: number;
  hobbyId: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}