import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  User, 
  MapPin, 
  Hash,
  FileText,
  Eye,
  BarChart3,
  Globe,
  Table,
  PenTool
} from 'lucide-react';
import type { StructuredText } from '@shared/schema';

interface StructuredTextViewProps {
  structuredText: StructuredText | null | undefined;
  extractedText?: string | null;
}

const DocumentTypeIcons = {
  invoice: <FileText className="w-4 h-4" />,
  receipt: <DollarSign className="w-4 h-4" />,
  contract: <PenTool className="w-4 h-4" />,
  resume: <User className="w-4 h-4" />,
  id: <Hash className="w-4 h-4" />,
  report: <BarChart3 className="w-4 h-4" />,
  other: <FileText className="w-4 h-4" />
};

const DocumentTypeColors = {
  invoice: 'bg-blue-50 text-blue-700 border-blue-200',
  receipt: 'bg-green-50 text-green-700 border-green-200',
  contract: 'bg-purple-50 text-purple-700 border-purple-200',
  resume: 'bg-orange-50 text-orange-700 border-orange-200',
  id: 'bg-red-50 text-red-700 border-red-200',
  report: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200'
};

export default function StructuredTextView({ structuredText, extractedText }: StructuredTextViewProps) {
  if (!structuredText && !extractedText) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No text content available</p>
      </div>
    );
  }

  // Show raw text if no structured data
  if (!structuredText && extractedText) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Extracted Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">
            {extractedText}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!structuredText) return null;

  const { entities, sections, documentType, confidence, metadata } = structuredText;

  const hasEntities = Object.values(entities).some(arr => arr.length > 0);

  return (
    <div className="space-y-6">
      {/* Document Analysis Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Document Analysis
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={DocumentTypeColors[documentType]}
              >
                {DocumentTypeIcons[documentType]}
                <span className="ml-1 capitalize">{documentType}</span>
              </Badge>
              <Badge variant="outline">
                {Math.round(confidence * 100)}% confidence
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Words:</span>
              <span className="font-medium">{metadata.wordCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Lines:</span>
              <span className="font-medium">{metadata.lineCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Table:</span>
              <span className="font-medium">{metadata.hasTable ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Signature:</span>
              <span className="font-medium">{metadata.hasSignature ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Entities */}
      {hasEntities && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Extracted Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entities.emails.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm">Email Addresses</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.emails.map((email, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entities.phones.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-sm">Phone Numbers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.phones.map((phone, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                      {phone}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entities.dates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">Dates</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.dates.map((date, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                      {date}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entities.amounts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-sm">Amounts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.amounts.map((amount, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-50 text-orange-700">
                      {amount}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entities.names.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-sm">Names</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.names.map((name, index) => (
                    <Badge key={index} variant="secondary" className="bg-indigo-50 text-indigo-700">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entities.addresses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-sm">Addresses</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.addresses.map((address, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-50 text-red-700">
                      {address}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entities.numbers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm">Reference Numbers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.numbers.map((number, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-50 text-gray-700">
                      {number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.title && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Title</h4>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900">{sections.title}</p>
              </div>
            </div>
          )}

          {sections.header.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Header</h4>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                {sections.header.map((line, index) => (
                  <p key={index} className="text-sm">{line}</p>
                ))}
              </div>
            </div>
          )}

          {sections.body.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Body Content</h4>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 max-h-64 overflow-y-auto">
                {sections.body.map((line, index) => (
                  <p key={index} className="text-sm">{line}</p>
                ))}
              </div>
            </div>
          )}

          {sections.footer.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Footer</h4>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                {sections.footer.map((line, index) => (
                  <p key={index} className="text-sm">{line}</p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Processed Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{structuredText.processedText}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Raw Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Raw Extracted Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
            {structuredText.rawText}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
