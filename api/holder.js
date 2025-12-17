export default async function handler(req, res) {
    const TOKEN_ADDRESS =
        "6wCYEZEBFQC7CHndo7p7KejyM4oGgi5E1Ya1e9eQpump"

    try {
        const response = await fetch(
            `https://api.solscan.io/token/meta?tokenAddress=${TOKEN_ADDRESS}`,
            {
                headers: {
                    token: process.env.SOLSCAN_API_KEY,
                },
            }
        )

        const data = await response.json()

        res.status(200).json({
            holders: data?.data?.holder ?? null,
        })
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch holders" })
    }
}
