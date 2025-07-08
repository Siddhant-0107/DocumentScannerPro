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
        if (!doc.uploadDate) return; // skip if missing
        const dateObj = new Date(doc.uploadDate);
        if (isNaN(dateObj.getTime())) return; // skip if invalid date
        const docDate = dateObj.toISOString().split('T')[0];
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent style={{ minHeight: 260 }}>
            {analyticsData.categoryData.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {analyticsData.categoryData.map(cat => (
                  <Badge key={cat.name} style={{ background: cat.color }}>{cat.name}</Badge>
                ))}
              </div>
            )}
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label
                >
                  {analyticsData.categoryData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Uploads Over Time */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Uploads (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.timelineData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={10} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Processing Status */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label
                >
                  {analyticsData.statusData.map((entry, idx) => (
                    <Cell key={`cell-status-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {analyticsData.statusData.map(stat => (
                <Badge key={stat.name} style={{ background: stat.color }}>{stat.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Type & Top Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>File Types</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.fileTypeData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.topTags.length === 0 ? (
              <p className="text-gray-400">No tags found.</p>
            ) : (
              <ul className="space-y-1">
                {analyticsData.topTags.map(tag => (
                  <li key={tag.tag} className="flex items-center gap-2">
                    <Badge>{tag.tag}</Badge>
                    <span className="text-xs text-gray-500">{tag.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage & Processing Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Storage Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>Total: <span className="font-bold">{formatFileSize(analyticsData.storageData.totalSize)}</span></div>
              <div>Average: <span className="font-bold">{formatFileSize(analyticsData.storageData.averageSize)}</span></div>
              <div>Largest: <span className="font-bold">{formatFileSize(analyticsData.storageData.largestFile)}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Processing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>Success Rate: <span className="font-bold">{analyticsData.processingStats.successRate.toFixed(1)}%</span></div>
              <div>Avg. Time: <span className="font-bold">{analyticsData.processingStats.averageProcessingTime}</span></div>
              <div>Total Processed: <span className="font-bold">{analyticsData.processingStats.totalProcessed}</span></div>
            </div>
          </CardContent>
        </Card>
        {/* Top Categories Card */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.categoryData.length === 0 ? (
              <p className="text-gray-400">No categories found.</p>
            ) : (
              <ul className="space-y-1">
                {analyticsData.categoryData
                  .slice() // copy array
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map(cat => (
                    <li key={cat.name} className="flex items-center gap-2">
                      <Badge style={{ background: cat.color }}>{cat.name}</Badge>
                      <span className="text-xs text-gray-500">{cat.count}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}