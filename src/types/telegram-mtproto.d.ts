declare module 'telegram-mtproto' {
    export class MTProto {
        constructor(config: {
            server: {
                ip: string;
                port: number;
                publicKey: string;
            }
        });

        connect(): Promise<void>;
        disconnect(): Promise<void>;
        call(method: string, params: any): Promise<any>;
        on(event: string, callback: (data: any) => void): void;
    }
} 