/**
 * Interface representing an SGX attestation.
 *
 * @property {string} quote - The SGX quote.
 * @property {number} timestamp - The timestamp of the attestation.
 */
export interface SgxAttestation {
    quote: string;
    timestamp: number;
}