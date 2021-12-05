// NOTE: This is a compromise, but we can afford it cause QuickAccs require a secondary key
// Consider making it more
const SCRYPT_ITERATIONS = 131072 / 8

// NOTE: those should only apply to new accounts, never for existing accounts, since some existing accounts may be on older versions of those
const accountPresets = {
    salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
    identityFactoryAddr: '0xBf07a0Df119Ca234634588fbDb5625594E2a5BCA',
    baseIdentityAddr: '0x2A2b85EB1054d6f0c6c2E37dA05eD3E5feA684EF',
    quickAccManager: '0xfF3f6D14DF43c112aB98834Ee1F82083E07c26BF',
    feeCollector: '0x942f9CE5D9a33a82F88D233AEb3292E680230348',
    quickAccTimelock: 259200, // 3 days
    encryptionOpts: { scrypt: { N: SCRYPT_ITERATIONS } }
}
export default accountPresets