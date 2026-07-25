import { createConfig, http } from 'wagmi';
import { celo, celoSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain, type EIP1193Provider } from 'viem';
import '../config';

type MiniPayProvider = EIP1193Provider & {
    isMiniPay?: boolean;
};

function readChainId(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function injectedProvider(): MiniPayProvider | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.ethereum as MiniPayProvider | undefined;
}

const targetChainId = readChainId(import.meta.env.VITE_CHAIN_ID, 44787);
const rpcUrl = import.meta.env.VITE_CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org';

const celoTestnet = {
    ...celoSepolia,
    id: targetChainId,
    name: targetChainId === 11142220 ? 'Celo Sepolia' : celoSepolia.name,
    rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
    },
} as const;

const customCeloTestnet = defineChain(celoTestnet);

const celoMainnet = {
    ...celo,
    rpcUrls: {
        default: { http: ['https://forno.celo.org'] },
        public: { http: ['https://forno.celo.org'] },
    },
} as const;

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
    chains: [customCeloTestnet, celoMainnet],
    connectors: [
        injected({
            shimDisconnect: true,
            target() {
                return {
                    id: 'injected',
                    name: 'Injected',
                    provider: injectedProvider,
                };
            },
        }),
        ...(projectId
            ? [
                  walletConnect({
                      projectId,
                      showQrModal: true,
                  }),
              ]
            : []),
    ],
    transports: {
        [customCeloTestnet.id]: http(rpcUrl),
        [celoMainnet.id]: http(),
    },
});

export function isMiniPay(): boolean {
    const ethereum = injectedProvider();
    return ethereum?.isMiniPay === true;
}

export function getChainId(): number {
    return targetChainId;
}

export function getActiveChain() {
    return targetChainId === celo.id ? celoMainnet : customCeloTestnet;
}

export function chainDisplayName(): string {
    if (targetChainId === celo.id) return 'Celo Mainnet';
    if (targetChainId === 11142220) return 'Celo Sepolia';
    return 'Celo Alfajores Testnet';
}
