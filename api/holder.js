// /api/holder.js
export default async function handler(req, res) {
    try {
        const API_KEY = process.env.HELIUS_API_KEY; // Make sure this is set in Vercel
        const MINT = req.query.mint;

        if (!API_KEY) {
            return res
                .status(500)
                .json({
                    error: "HELIUS_API_KEY is not set in environment variables",
                });
        }

        if (!MINT) {
            return res
                .status(400)
                .json({ error: "Missing mint query parameter" });
        }

        // Prepare Helius RPC call
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

        // Fetch from Helius DAS
        const response = await fetch(
            `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                `Helius API responded with status ${response.status}: ${text}`
            );
        }

        const data = await response.json();

        if (!data.result || !data.result.value) {
            return res
                .status(500)
                .json({ error: "Unexpected Helius response structure", data });
        }

        const holders = data.result.value;
        const uniqueOwners = new Set(
            holders.map((a) => a.account.data.parsed.info.owner)
        );

        res.status(200).json({ totalHolders: uniqueOwners.size });
    } catch (err) {
        console.error("Error in holder.js:", err);
        res.status(500).json({ error: err.message });
    }
}
