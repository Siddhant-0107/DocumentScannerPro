import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar, DollarSign, User, MapPin, Hash, FileText, Eye, Table, PenTool } from 'lucide-react';
import type { StructuredText } from '@shared/schema';

interface StructuredTextViewProps { structuredText: StructuredText | null | undefined; extractedText?: string | null; }

export default function StructuredTextView({ structuredText, extractedText }: StructuredTextViewProps) {
  if (!structuredText && !extractedText) return <div className="text-center py-8 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No text content available</p></div>;

  if (!structuredText && extractedText) return (
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Extracted Text</CardTitle></CardHeader><CardContent><div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">{extractedText}</div></CardContent></Card>
  );

  if (!structuredText) return null;
  const { entities, confidence, metadata } = structuredText;
  const hasEntities = Object.values(entities).some(arr => arr.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Document Analysis</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-500" /><span className="text-gray-600">Words:</span><span className="font-medium">{metadata.wordCount}</span></div>
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-500" /><span className="text-gray-600">Lines:</span><span className="font-medium">{metadata.lineCount}</span></div>
            <div className="flex items-center gap-2"><Table className="w-4 h-4 text-gray-500" /><span className="text-gray-600">Table:</span><span className="font-medium">{metadata.hasTable ? 'Yes' : 'No'}</span></div>
            <div className="flex items-center gap-2"><PenTool className="w-4 h-4 text-gray-500" /><span className="text-gray-600">Signature:</span><span className="font-medium">{metadata.hasSignature ? 'Yes' : 'No'}</span></div>
          </div>
          {typeof confidence === 'number' && <div className="mt-4 text-sm text-gray-600">Processing confidence: {Math.round(confidence * 100)}%</div>}
        </CardContent>
      </Card>

      {hasEntities && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Hash className="w-5 h-5" />Extracted Information</CardTitle></CardHeader><CardContent className="space-y-4">
        {entities.emails.length > 0 && <EntityGroup icon={<Mail className="w-4 h-4" />} title="Email Addresses" values={entities.emails} />}
        {entities.phones.length > 0 && <EntityGroup icon={<Phone className="w-4 h-4" />} title="Phone Numbers" values={entities.phones} />}
        {entities.dates.length > 0 && <EntityGroup icon={<Calendar className="w-4 h-4" />} title="Dates" values={entities.dates} />}
        {entities.amounts.length > 0 && <EntityGroup icon={<DollarSign className="w-4 h-4" />} title="Amounts" values={entities.amounts} />}
        {entities.names.length > 0 && <EntityGroup icon={<User className="w-4 h-4" />} title="Names" values={entities.names} />}
        {entities.addresses.length > 0 && <EntityGroup icon={<MapPin className="w-4 h-4" />} title="Addresses" values={entities.addresses} />}
        {entities.numbers.length > 0 && <EntityGroup icon={<Hash className="w-4 h-4" />} title="Reference Numbers" values={entities.numbers} />}
      </CardContent></Card>}

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Processed Text</CardTitle></CardHeader><CardContent><div className="bg-green-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto"><ReactMarkdown remarkPlugins={[remarkGfm]}>{structuredText.processedText}</ReactMarkdown></div></CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Raw Extracted Text</CardTitle></CardHeader><CardContent><div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">{structuredText.rawText}</div></CardContent></Card>
    </div>
  );
}

function EntityGroup({ icon, title, values }: { icon: React.ReactNode; title: string; values: string[] }) {
  return <div><div className="flex items-center gap-2 mb-2">{icon}<span className="font-medium text-sm">{title}</span></div><div className="flex flex-wrap gap-2">{values.map((value, index) => <Badge key={index} variant="secondary">{value}</Badge>)}</div></div>;
}
