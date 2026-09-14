import { useState } from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Document } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Answer {
  answer: string;
  sources: Array<{ chunk: number; similarity: number; content: string }>;
}

export default function DocumentAssistant() {
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => apiRequest("GET", "/api/documents"),
  });

  const ask = async () => {
    if (!documentId || !question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer(null);
    try {
      const result = await apiRequest("POST", `/api/documents/${documentId}/ask`, {
        question: question.trim(),
      });
      setAnswer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to answer question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Ask Your Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="assistant-document">Document</Label>
          <select
            id="assistant-document"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm bg-white"
          >
            <option value="">Select a processed document</option>
            {documents
              .filter((doc) => doc.processingStatus === "completed")
              .map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.title || doc.originalName}</option>
              ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
            placeholder="e.g. What is the total amount?"
            disabled={!documentId || loading}
          />
          <Button onClick={ask} disabled={!documentId || !question.trim() || loading} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {answer && (
          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Answer</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{answer.answer}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Retrieved context</p>
              <div className="space-y-2">
                {answer.sources.map((source) => (
                  <div key={source.chunk} className="text-xs border-l-2 border-primary/40 pl-2 text-gray-600">
                    Chunk {source.chunk} · {Math.round(source.similarity * 100)}% similarity
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
