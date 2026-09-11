import type RepositoryInterface from "../../@shared/repository/repository-interface.js";
import type User from "../entity/user.js";

export default interface UserRepositoryInterface extends RepositoryInterface<User> {}