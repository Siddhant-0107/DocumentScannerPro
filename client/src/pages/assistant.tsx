import DocumentAssistant from "@/components/document-assistant";

export default function AssistantPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-indigo-100/80 p-6">
      <div className="max-w-3xl mx-auto pt-10">
        <h1 className="text-3xl font-bold mb-2">AI Document Assistant</h1>
        <p className="text-gray-600 mb-6">
          Ask questions about a processed document. Answers are generated from retrieved document context.
        </p>
        <DocumentAssistant />
      </div>
    </main>
  );
}
