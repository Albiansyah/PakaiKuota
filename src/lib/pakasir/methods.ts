export const PAKASIR_METHODS = [
  'cimb_niaga_va',
  'bni_va',
  'qris',
  'sampoerna_va',
  'bnc_va',
  'maybank_va',
  'permata_va',
  'atm_bersama_va',
  'artha_graha_va',
  'bri_va',
] as const;

export type PakasirMethod = (typeof PAKASIR_METHODS)[number];

export function isPakasirMethod(value: string): value is PakasirMethod {
  return (PAKASIR_METHODS as readonly string[]).includes(value);
}
