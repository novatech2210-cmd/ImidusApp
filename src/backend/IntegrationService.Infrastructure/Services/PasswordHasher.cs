using System;
using System.Security.Cryptography;
using System.Text;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.Infrastructure.Services
{
    /// <summary>
    /// Password hashing implementation using SHA256.
    /// Provides backward compatibility with legacy plaintext passwords.
    ///
    /// Security Note: SHA256 is used for backward compatibility.
    /// Recommended: Migrate to bcrypt/Argon2 in future iterations.
    /// </summary>
    public class PasswordHasher : IPasswordHasher
    {
        private const int SHA256_HASH_LENGTH = 64; // SHA256 hex string length

        /// <summary>
        /// Hashes password using SHA256 with salt.
        /// </summary>
        public string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                throw new ArgumentException("Password cannot be null or empty", nameof(password));

            using var sha256 = SHA256.Create();

            // Use password itself as salt for deterministic hashing (backward compatible)
            // Future: Add random salt and store separately
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);

            // Convert to hex string
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }

        /// <summary>
        /// Verifies password against stored password (hashed or plaintext).
        /// </summary>
        public bool VerifyPassword(string password, string storedPassword)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(storedPassword))
                return false;

            // Check if stored password is plaintext (legacy)
            if (IsPlaintextPassword(storedPassword))
            {
                // Direct comparison for legacy plaintext passwords
                return password.Equals(storedPassword, StringComparison.Ordinal);
            }

            // Hash the input password and compare
            var hashedInput = HashPassword(password);
            return hashedInput.Equals(storedPassword, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Determines if stored password is plaintext (not a SHA256 hash).
        /// SHA256 hashes are always 64 hex characters.
        /// </summary>
        public bool IsPlaintextPassword(string storedPassword)
        {
            if (string.IsNullOrEmpty(storedPassword))
                return true;

            // SHA256 hash is always 64 hex characters
            if (storedPassword.Length != SHA256_HASH_LENGTH)
                return true;

            // Check if all characters are hex digits
            foreach (char c in storedPassword)
            {
                if (!Uri.IsHexDigit(c))
                    return true;
            }

            return false;
        }
    }
}
