import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMiniPay, getChainId } from './provider';

export function useWallet() {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [inMiniPay, setInMiniPay] = useState(false);
    const autoConnectAttempted = useRef(false);

    useEffect(() => {
        setInMiniPay(isMiniPay());
    }, []);

    const autoConnect = useCallback(async () => {
        if (isConnected || isConnecting) return;
        const injected = connectors.find((c) => c.id === 'injected');
        if (injected && isMiniPay()) {
            try {
                await connect({ connector: injected });
                const targetChainId = getChainId();
                if (chainId !== targetChainId) {
                    await switchChain({ chainId: targetChainId });
                }
            } catch {
                // silent fail — user is in MiniPay, connection is implicit
            }
        }
    }, [connect, connectors, isConnected, isConnecting, chainId, switchChain]);

    useEffect(() => {
        if (inMiniPay && !autoConnectAttempted.current) {
            autoConnectAttempted.current = true;
            void autoConnect();
        }
    }, [autoConnect, inMiniPay]);

    const shortAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : null;

    const isCorrectChain = chainId === getChainId();

    const switchToCelo = useCallback(() => {
        switchChain({ chainId: getChainId() });
    }, [switchChain]);

    const handleConnect = useCallback(() => {
        const c = connectors.find((x) => x.id === 'injected');
        if (c) connect({ connector: c });
    }, [connect, connectors]);

    const handleDisconnect = useCallback(() => {
        disconnect();
    }, [disconnect]);

    return {
        address,
        isConnected,
        isConnecting,
        shortAddress,
        chainId,
        isCorrectChain,
        inMiniPay,
        connect: handleConnect,
        disconnect: handleDisconnect,
        switchToCelo,
    };
}
