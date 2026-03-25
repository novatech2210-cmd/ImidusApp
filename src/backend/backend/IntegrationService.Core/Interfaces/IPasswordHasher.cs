using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Password hashing service for secure credential storage.
    /// Supports backward compatibility with legacy plaintext passwords.
    /// </summary>
    public interface IPasswordHasher
    {
        /// <summary>
        /// Hashes a plaintext password using SHA256 (for backward compatibility).
        /// Future: Migrate to bcrypt for enhanced security.
        /// </summary>
        string HashPassword(string password);

        /// <summary>
        /// Verifies a plaintext password against a stored hash.
        /// Supports both hashed and legacy plaintext passwords.
        /// </summary>
        /// <param name="password">Plaintext password to verify</param>
        /// <param name="storedPassword">Stored password (hashed or plaintext)</param>
        /// <returns>True if password matches, false otherwise</returns>
        bool VerifyPassword(string password, string storedPassword);

        /// <summary>
        /// Checks if a stored password is plaintext (legacy) or hashed.
        /// </summary>
        bool IsPlaintextPassword(string storedPassword);
    }
}
