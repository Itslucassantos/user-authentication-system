import type RepositoryInterface from "../../@shared/repository/repository-interface.js";
import type PasswordToken from "../entity/password-token.js";

export default interface PasswordTokenRepositoryInterface extends RepositoryInterface<PasswordToken> {
    findByTokenHash(tokenHash: string): Promise<PasswordToken | null>;
}