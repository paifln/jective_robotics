/** Legacy 32-byte base64url tokens and explicitly prefixed new JECTIVE tokens. */
export function isLearnerCredential(value:unknown):value is string{
 return typeof value==='string'&&/^(?:jt_)?[A-Za-z0-9_-]{43}$/.test(value)&&!value.startsWith('sk-');
}
