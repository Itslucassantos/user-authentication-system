export interface UpdateUserInputDto {
  userId: string;
  name: string;
}

export interface UpdateUserOutputDto {
  id: string;
  name: string;
  email: string;
  active: boolean;
}
