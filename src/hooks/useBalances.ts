import { NativeBalance } from "./../types/NativeBalance";
import { useCallback, useEffect, useState } from "react";
import Moralis from "moralis";
import { TokenBalance } from "@/types/TokenBalance";
import { useAppContext } from "@/contexts/AppContext";
import { current_chain } from "@/util/chain";

// Moralis API anahtarını ekliyoruz
const myApiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

// Belirli bir fantoken'in bakiyesini kontrol eden helper fonksiyon
function hasEnoughFantokenBalance(tokenBalances: TokenBalance[], symbol: string = "MYFANTOKEN"): boolean {
    const specificToken = tokenBalances.find(token => token.symbol === symbol);
    if (!specificToken) return false;  // Aranan token bulunamazsa false döndür
    return parseFloat(specificToken.balance) > 1;
}

export function useBalances() {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
    const [nativeBalance, setNativeBalance] = useState<NativeBalance>();
    const { address } = useAppContext();

    const fetchTokenBalance = useCallback(async () => {
        try {
            if (!address) return;
            if (!Moralis.Core.isStarted) {
                await Moralis.start({ apiKey: myApiKey });
            }

            const token_balances = await fetch(
                `https://deep-index.moralis.io/api/v2.2/${address}/erc20?` +
                new URLSearchParams({
                    chain: current_chain,
                }),
                {
                    method: "get",
                    headers: {
                        accept: "application/json",
                        "X-API-Key": `${myApiKey}`,
                    },
                }
            );

            const tokens = await token_balances.json();
            setTokenBalances(tokens);

            const native_balance = await fetch(
                `https://deep-index.moralis.io/api/v2.2/${address}/balance?` +
                new URLSearchParams({
                    chain: current_chain,
                }),
                {
                    method: "get",
                    headers: {
                        accept: "application/json",
                        "X-API-Key": `${myApiKey}`,
                    },
                }
            );
            const native = await native_balance.json();
            setNativeBalance(native);
        } catch (error) {
            console.log("Error fetching token balances: ", error);
            setMessage("Error fetching token balances");
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchTokenBalance();
    }, [fetchTokenBalance]);


    const isEligibleForFantoken = hasEnoughFantokenBalance(tokenBalances);


    return {
        loading,
        message,
        tokenBalances,
        nativeBalance,
        isEligibleForFantoken
    };
}
