// /api/holder.js
export default async function handler(req, res) {
    try {
        const API_KEY = process.env.HELIUS_API_KEY;
        const MINT = req.query.mint;

        if (!API_KEY)
            return res.status(500).json({ error: "HELIUS_API_KEY not set" });
        if (!MINT)
            return res
                .status(400)
                .json({ error: "Missing mint query parameter" });

        const body = {
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccounts",
            params: [
                MINT, // string, directly
                { limit: 1000 }, // options
            ],
        };

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
            throw new Error(`Helius API responded ${response.status}: ${text}`);
        }

        const data = await response.json();

        // Ensure the expected field exists
        if (!data.result || !Array.isArray(data.result.token_accounts)) {
            return res
                .status(500)
                .json({ error: "Unexpected Helius response structure", data });
        }

        const holders = data.result.token_accounts;
        const uniqueOwners = new Set(holders.map((acc) => acc.account.owner));

        res.status(200).json({ totalHolders: uniqueOwners.size });
    } catch (err) {
        console.error("Error in holder.js:", err);
        res.status(500).json({ error: err.message });
    }
}
