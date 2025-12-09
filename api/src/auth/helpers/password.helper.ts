import * as bcrypt from 'bcryptjs';

/**
 * Helper para gerenciar senhas
 */
export class PasswordHelper {
  /**
   * Gera um hash da senha
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compara uma senha com um hash
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Gera um hash da senha "123" para uso em desenvolvimento
   * Execute este método uma vez para obter o hash correto
   */
  static async generateTestHash(): Promise<string> {
    const hash = await this.hash('123');
    return hash;
  }
}
