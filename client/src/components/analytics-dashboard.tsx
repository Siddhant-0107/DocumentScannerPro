import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, FileText, Tags } from "lucide-react";
import { type Document, type Category } from "@shared/schema";

export default function AnalyticsDashboard() {
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Calculate analytics data
  const analyticsData = {
    // Document counts by category
    categoryData: categories.map(category => ({
      name: category.name,
      count: documents.filter(doc => (doc.categories || []).includes(category.name)).length,
      color: category.color,
    })),

    // Documents uploaded over time (last 30 days)
    timelineData: (() => {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          count: 0,
        };
      });

      documents.forEach(doc => {
        const docDate = new Date(doc.uploadDate).toISOString().split('T')[0];
        const dayEntry = last30Days.find(day => day.date === docDate);
        if (dayEntry) {
          dayEntry.count++;
        }
      });

      return last30Days;
    })(),

    // Processing status distribution
    statusData: [
      { name: "Completed", count: documents.filter(doc => doc.processingStatus === "completed").length, color: "#10B981" },
      { name: "Processing", count: documents.filter(doc => doc.processingStatus === "processing").length, color: "#F59E0B" },
      { name: "Pending", count: documents.filter(doc => doc.processingStatus === "pending").length, color: "#6B7280" },
      { name: "Failed", count: documents.filter(doc => doc.processingStatus === "failed").length, color: "#EF4444" },
    ].filter(item => item.count > 0),

    // File type distribution
    fileTypeData: (() => {
      const types: Record<string, number> = {};
      documents.forEach(doc => {
        const type = doc.fileType.startsWith('image/') ? 'Images' : 'PDFs';
        types[type] = (types[type] || 0) + 1;
      });
      return Object.entries(types).map(([name, count]) => ({ name, count }));
    })(),

    // Top tags
    topTags: (() => {
      const tagCounts: Record<string, number> = {};
      documents.forEach(doc => {
        (doc.tags || []).forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
    })(),

    // Storage usage
    storageData: {
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      averageSize: documents.length > 0 ? documents.reduce((sum, doc) => sum + doc.fileSize, 0) / documents.length : 0,
      largestFile: documents.length > 0 ? Math.max(...documents.map(doc => doc.fileSize)) : 0,
    },

    // Processing efficiency
    processingStats: {
      successRate: documents.length > 0 ? 
        (documents.filter(doc => doc.processingStatus === "completed").length / documents.length * 100) : 0,
      averageProcessingTime: "~2 minutes", // This would be calculated from actual processing times
      totalProcessed: documents.filter(doc => doc.processingStatus === "completed").length,
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">{analyticsData.processingStats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="text-orange-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Avg. Processing</p>
                <p className="text-2xl font-bold">{analyticsData.processingStats.averageProcessingTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tags className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-gray-500">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(analyticsData.storageData.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Document Uploads (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Documents by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {analyticsData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Status */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6">
                  {analyticsData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* File Types */}
        <Card>
          <CardHeader>
            <CardTitle>File Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.fileTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {analyticsData.fileTypeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? "#10B981" : "#EF4444"} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Tags and Storage Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.topTags.length > 0 ? (
              <div className="space-y-2">
                {analyticsData.topTags.map(({ tag, count }) => (
                  <div key={tag} className="flex items-center justify-between">
                    <Badge variant="secondary">{tag}</Badge>
                    <span className="text-sm text-gray-500">{count} documents</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tags found</p>
            )}
          </CardContent>
        </Card>

        {/* Storage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Storage:</span>
                <span className="font-medium">{formatFileSize(analyticsData.storageData.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average File Size:</span>
                <span className="font-medium">{formatFileSize(analyticsData.storageData.averageSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Largest File:</span>
                <span className="font-medium">{formatFileSize(analyticsData.storageData.largestFile)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documents Processed:</span>
                <span className="font-medium">{analyticsData.processingStats.totalProcessed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}