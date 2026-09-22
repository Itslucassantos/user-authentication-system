export interface CreateUserInputDto {
  name: string;
  email: string;
}

export interface CreateUserOutputDto {
  id: string;
  name: string;
  email: string;
  active: boolean;
}
