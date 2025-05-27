"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { getApiUrl } from '@/lib/config'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  FileText,
  Calendar as CalendarIcon,
  Download,
  Filter
} from 'lucide-react'

interface ChartData {
  name: string
  value: number
  change?: number
}

interface TimeSeriesData {
  date: string
  cases: number
  resolved: number
  revenue: number
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [timeframe, setTimeframe] = useState('30d')
  
  // Mock data - in real app this would come from APIs
  const [kpiData, setKpiData] = useState({
    totalCases: { value: 245, change: 12.5 },
    resolvedCases: { value: 198, change: 8.3 },
    avgResolutionTime: { value: 45, change: -5.2 },
    totalRevenue: { value: 125000, change: 15.7 },
    activeArbitrators: { value: 18, change: 2.1 },
    satisfactionRate: { value: 94.2, change: 3.1 }
  })

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([
    { date: '2024-04-01', cases: 8, resolved: 6, revenue: 12000 },
    { date: '2024-04-08', cases: 12, resolved: 9, revenue: 15000 },
    { date: '2024-04-15', cases: 15, resolved: 11, revenue: 18000 },
    { date: '2024-04-22', cases: 10, resolved: 8, revenue: 14000 },
    { date: '2024-04-29', cases: 14, resolved: 12, revenue: 17000 },
    { date: '2024-05-06', cases: 18, resolved: 14, revenue: 21000 },
    { date: '2024-05-13', cases: 16, resolved: 13, revenue: 19000 },
    { date: '2024-05-20', cases: 20, resolved: 16, revenue: 24000 }
  ])

  const [caseStatusData, setCaseStatusData] = useState([
    { name: 'Active', value: 47, color: '#3B82F6' },
    { name: 'Resolved', value: 198, color: '#10B981' },
    { name: 'Pending', value: 23, color: '#F59E0B' },
    { name: 'Cancelled', value: 12, color: '#EF4444' }
  ])

  const [arbitratorPerformance, setArbitratorPerformance] = useState([
    { name: 'John Smith', cases: 24, avgTime: 42, satisfaction: 96 },
    { name: 'Sarah Wilson', cases: 18, avgTime: 38, satisfaction: 94 },
    { name: 'Michael Brown', cases: 21, avgTime: 45, satisfaction: 92 },
    { name: 'Emily Davis', cases: 15, avgTime: 41, satisfaction: 98 },
    { name: 'Robert Johnson', cases: 19, avgTime: 47, satisfaction: 89 }
  ])

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const SimpleBarChart = ({ data, height = 200 }: { data: TimeSeriesData[], height?: number }) => {
    const maxValue = Math.max(...data.map(d => d.cases))
    
    return (
      <div className="flex items-end space-x-2" style={{ height }}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="bg-blue-500 rounded-t w-full min-h-[4px]"
              style={{ height: `${(item.cases / maxValue) * (height - 40)}px` }}
            />
            <span className="text-xs text-gray-500 mt-2 transform rotate-45 origin-left">
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const SimpleLineChart = ({ data, height = 200 }: { data: TimeSeriesData[], height?: number }) => {
    const maxRevenue = Math.max(...data.map(d => d.revenue))
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((item.revenue / maxRevenue) * 80)
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="relative" style={{ height }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - ((item.revenue / maxRevenue) * 80)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill="#10B981"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
      </div>
    )
  }

  const SimplePieChart = ({ data }: { data: typeof caseStatusData }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    return (
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="3"/>
            {data.map((item, index) => {
              const strokeDasharray = `${(item.value / total) * 100} ${100 - (item.value / total) * 100}`
              const strokeDashoffset = -currentAngle
              currentAngle += (item.value / total) * 100
              
              return (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 21 21)"
                />
              )
            })}
          </svg>
        </div>
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">System performance metrics and insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalCases.value}</div>
            <div className={`text-xs flex items-center ${kpiData.totalCases.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.totalCases.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatPercent(kpiData.totalCases.change)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {kpiData.resolvedCases.value}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((kpiData.resolvedCases.value / kpiData.totalCases.value) * 100).toFixed(1)}%</div>
            <div className={`text-xs flex items-center ${kpiData.resolvedCases.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.resolvedCases.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatPercent(kpiData.resolvedCases.change)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.avgResolutionTime.value}d</div>
            <div className={`text-xs flex items-center ${kpiData.avgResolutionTime.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.avgResolutionTime.change < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
              {formatPercent(Math.abs(kpiData.avgResolutionTime.change))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue.value)}</div>
            <div className={`text-xs flex items-center ${kpiData.totalRevenue.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.totalRevenue.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatPercent(kpiData.totalRevenue.change)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Arbitrators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.activeArbitrators.value}</div>
            <div className={`text-xs flex items-center ${kpiData.activeArbitrators.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.activeArbitrators.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatPercent(kpiData.activeArbitrators.change)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {kpiData.satisfactionRate.value}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.satisfactionRate.value}%</div>
            <div className={`text-xs flex items-center ${kpiData.satisfactionRate.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.satisfactionRate.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatPercent(kpiData.satisfactionRate.change)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Volume Trends</CardTitle>
            <CardDescription>New cases filed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={timeSeriesData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Revenue generated over time</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={timeSeriesData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
            <CardDescription>Current case status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <SimplePieChart data={caseStatusData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arbitrator Performance</CardTitle>
            <CardDescription>Top performing arbitrators this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {arbitratorPerformance.map((arbitrator, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{arbitrator.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="font-medium">{arbitrator.name}</p>
                      <p className="text-sm text-gray-500">{arbitrator.cases} cases</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{arbitrator.avgTime}d avg</p>
                    <p className="text-sm text-green-600">{arbitrator.satisfaction}% satisfaction</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 