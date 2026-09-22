export interface GetUserInputDto {
  userId: string;
}

export interface GetUserOutputDto {
  id: string;
  name: string;
  email: string;
  active: boolean;
}
