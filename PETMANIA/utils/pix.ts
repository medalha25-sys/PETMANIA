
export class Pix {
    private merchantName: string;
    private merchantCity: string;
    private pixKey: string;
    private amount: string;
    private txId: string;

    constructor(
        pixKey: string,
        merchantName: string,
        merchantCity: string,
        amount: string,
        txId: string = '***'
    ) {
        this.merchantName = merchantName;
        this.merchantCity = merchantCity;
        this.pixKey = pixKey;
        this.amount = amount;
        this.txId = txId;
    }

    private formatValue(id: string, value: string): string {
        const size = value.length.toString().padStart(2, '0');
        return `${id}${size}${value}`;
    }

    private getMerchantAccountInformation(): string {
        const gui = this.formatValue('00', 'br.gov.bcb.pix');
        const key = this.formatValue('01', this.pixKey);
        return this.formatValue('26', `${gui}${key}`);
    }

    private getAdditionalDataFieldTemplate(): string {
        const txId = this.formatValue('05', this.txId);
        return this.formatValue('62', txId);
    }

    // Polynomial: 0x1021
    private getCRC16(payload: string): string {
        let crc = 0xFFFF; // Initial value
        const polynomial = 0x1021;

        for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = (crc << 1) ^ polynomial;
                } else {
                    crc = crc << 1;
                }
            }
        }

        // Mask to 16-bit unsigned integer
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    public getPayload(): string {
        const payload = [
            this.formatValue('00', '01'), // Payload Format Indicator
            this.getMerchantAccountInformation(),
            this.formatValue('52', '0000'), // Merchant Category Code
            this.formatValue('53', '986'), // Transaction Currency (BRL)
            this.formatValue('54', this.amount), // Transaction Amount
            this.formatValue('58', 'BR'), // Country Code
            this.formatValue('59', this.merchantName), // Merchant Name
            this.formatValue('60', this.merchantCity), // Merchant City
            this.getAdditionalDataFieldTemplate(),
            '6304' // CRC16 placeholder
        ].join('');

        return `${payload}${this.getCRC16(payload)}`;
    }
}
