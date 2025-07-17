import { Box, Heading, Text } from "@chakra-ui/react";
import React, { useState } from "react";

const AskBusinessPlan = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const token = localStorage.getItem("access_token");
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: query }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming unsupported");
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResponse(text);
      }
    } catch (err) {
      console.error(err);
      setResponse("Error fetching response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mt={8}>
      <Heading as="h3" size="md" mb={4}>
        Ask the Business Plan
      </Heading>
      <form onSubmit={handleSubmit}>
        <Box mb={4}>
          <input
            style={{ width: "100%", padding: "8px" }}
            placeholder="Ask a question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Send"}
        </button>
      </form>
      {response && (
        <Box mt={6} p={4} bg="gray.50" borderRadius="md">
          <Text whiteSpace="pre-wrap">{response}</Text>
        </Box>
      )}
    </Box>
  );
};

export default AskBusinessPlan;
