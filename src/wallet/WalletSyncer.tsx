import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useGameStore } from '../store';
import { getPlayerProfile } from '../api';

export function WalletSyncer() {
    const { address, isConnected } = useAccount();
    const setWalletAddress = useGameStore((s) => s.setWalletAddress);
    const setRegistered = useGameStore((s) => s.setRegistered);
    const setPlayerName = useGameStore((s) => s.setPlayerName);

    useEffect(() => {
        let cancelled = false;

        if (isConnected && address) {
            setWalletAddress(address);
            void getPlayerProfile(address).then((profile) => {
                if (cancelled) return;
                setRegistered(profile?.registered === true);
                setPlayerName(profile?.name ?? null);
            });
        } else {
            setWalletAddress(null);
            setRegistered(false);
            setPlayerName(null);
        }

        return () => {
            cancelled = true;
        };
    }, [address, isConnected, setWalletAddress, setRegistered, setPlayerName]);

    return null;
}
