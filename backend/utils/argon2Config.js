/**
 * Centralised Argon2id configuration.
 * algorithm: 2 = Argon2id (hybrid, recommended by OWASP)
 * memoryCost: 64 MB — makes brute-force expensive
 * timeCost: 3 iterations
 * parallelism: 4 threads
 */
const argon2 = require('@node-rs/argon2');

const ARGON2_OPTIONS = {
  algorithm: 2,       // Argon2id
  memoryCost: 65536,  // 64 MB
  timeCost: 3,
  parallelism: 4,
};

const hashPassword = (plain) => argon2.hash(plain, ARGON2_OPTIONS);
const verifyPassword = (hash, plain) => argon2.verify(hash, plain);

module.exports = { hashPassword, verifyPassword };
