// /api/holder.js
export default async function handler(req, res) {
    const API_KEY = process.env.HELIUS_API_KEY;
    const MINT = req.query.mint;

    if (!API_KEY) return res.status(500).json({ error: "HELIUS_API_KEY not set" });
    if (!MINT) return res.status(400).json({ error: "Missing mint query parameter" });

    // Keep the JSON-RPC payload simple and correct for Helius DAS
    const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccounts",
        params: [MINT, { limit: 1000 }],
    };

    // Use AbortController to prevent long-running serverless executions
    const TIMEOUT_MS = 8000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const text = await response.text().catch(() => "<non-text body>");
            console.error("Helius non-OK response:", response.status, text);
            return res.status(502).json({ error: "Bad response from Helius", status: response.status, text });
        }

        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            console.error("Failed parsing Helius JSON:", parseErr);
            return res.status(502).json({ error: "Invalid JSON from Helius" });
        }

        // Helius responses can vary; attempt a few common shapes
        const tokenAccounts =
            (data.result && data.result.token_accounts) ||
            (data.result && data.result.accounts) ||
            data.token_accounts ||
            null;

        if (!tokenAccounts || !Array.isArray(tokenAccounts)) {
            console.error("Unexpected Helius response shape", data);
            return res.status(500).json({ error: "Unexpected Helius response structure", data });
        }

        // Extract owner pubkeys robustly from each account object
        const owners = new Set();
        for (const acc of tokenAccounts) {
            // common shapes: acc.account.owner, acc.owner, acc.pubkey (owner elsewhere)
            let owner = null;
            if (acc && acc.account && acc.account.owner) owner = acc.account.owner;
            else if (acc && acc.owner) owner = acc.owner;
            else if (acc && acc.pubkey && acc.account && acc.account.data && acc.account.data.parsed && acc.account.data.parsed.info && acc.account.data.parsed.info.owner) owner = acc.account.data.parsed.info.owner;

            if (owner && typeof owner === "string") owners.add(owner);
        }

        res.status(200).json({ totalHolders: owners.size });
    } catch (err) {
        if (err.name === 'AbortError') {
            console.error("Helius request aborted (timeout)");
            return res.status(504).json({ error: "Helius request timed out" });
        }
        console.error("Error in holder.js:", err);
        res.status(500).json({ error: err.message || String(err) });
    } finally {
        clearTimeout(timeout);
    }
}
