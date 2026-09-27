export interface ListUsersInputDto {
  page: number;
  limit: number;
  clientApplicationId?: string;
}

export interface ListUsersUserDto {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface ListUsersOutputDto {
  items: ListUsersUserDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
