// @TODO update those pre-launch
// NOTE: those should only apply to new accounts, never for existing accounts, since some existing accounts may be on older versions of those
const accountPresets = {
    salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
    baseIdentityAddr: '0xD642b4c7ad09c79089B82CC28B19BB4437E59b61',
    identityFactoryAddr: '0xf5D7BD04c8557247978d032314bA2863f13D617E',
    quickAccManager: '0xA8AE248276ff3809E4Ec3a1fd4aaD82af940074a',
    feeCollector: '0x942f9CE5D9a33a82F88D233AEb3292E680230348',
    quickAccTimelock: 259200 // 3 days
}
export default accountPresets