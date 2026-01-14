import "dotenv/config";

async function testSearch() {
    const apiKey = process.env.TAVILY_API_KEY;
    const query = "history of artificial intelligence";

    try {
        console.log("Searching for:", query);
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "advanced",
                max_results: 5
            })
        });

        const data: any = await response.json();
        console.log("Response Status:", response.status);
        if (data.results) {
            console.log("Results Count:", data.results.length);
            console.log("First Result Title:", data.results[0]?.title);
        } else {
            console.log("No results found in response:", data);
        }
    } catch (e) {
        console.error("Search failed:", e);
    }
}

testSearch();
