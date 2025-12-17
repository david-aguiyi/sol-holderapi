// /api/getHolders.js
export default async function handler(req, res) {
    const API_KEY = process.env.HELIUS_API_KEY; // stored in Vercel env
    const MINT = req.query.mint;

    if (!MINT)
        return res.status(400).json({ error: "Missing mint query parameter" });

    const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByMint",
        params: [
            MINT,
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed" },
        ],
    };

    try {
        const response = await fetch(
            `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }
        );

        const data = await response.json();
        const holders = data.result.value;
        const uniqueOwners = new Set(
            holders.map((a) => a.account.data.parsed.info.owner)
        );

        res.status(200).json({ totalHolders: uniqueOwners.size });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
