import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Home as HomeIcon,
  BarChart,
  Download,
  RefreshCw
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import { cn } from '@/lib/utils'

// Agent IDs from orchestrator
const MEMO_CREATION_AGENT_ID = "6970e37c1d92f5e2dd22a95f"
const MEMO_REVIEW_AGENT_ID = "6970e3a51d92f5e2dd22a967"
const MEMO_EVALUATION_AGENT_ID = "6970e3c2d6d0dcaec111826a"

// TypeScript interfaces from REAL test responses

// Memo Creation Agent Response
interface RiskItem {
  risk_type: string
  description: string
  severity: string
}

interface RiskAnalysis {
  risks: RiskItem[]
  mitigation_strategies: string[]
}

interface RevenueForecast {
  year: string
  amount: number
  growth_rate: number
}

interface KeyMetric {
  metric_name: string
  value: string
}

interface FinancialProjections {
  revenue_forecast: RevenueForecast[]
  key_metrics: KeyMetric[]
}

interface Recommendations {
  action: string
  rationale: string
  conditions: string[]
}

interface MemoContent {
  executive_summary: string
  investment_thesis: string
  risk_analysis: RiskAnalysis
  financial_projections: FinancialProjections
  recommendations: Recommendations
}

interface MemoCreationResult {
  memo: MemoContent
  completeness_score: number
}

// Memo Review Agent Response
interface CompletenessReview {
  score: number
  missing_elements: string[]
  comments: string
}

interface AccuracyIssue {
  issue: string
  severity: string
  location: string
}

interface AccuracyReview {
  score: number
  issues_found: AccuracyIssue[]
  comments: string
}

interface ClarityReview {
  score: number
  unclear_sections: string[]
  comments: string
}

interface Inconsistency {
  issue: string
  impact: string
}

interface LogicalConsistencyReview {
  score: number
  inconsistencies: Inconsistency[]
  comments: string
}

interface GapAndImprovement {
  area: string
  gap: string
  recommendation: string
  priority: string
}

interface ReviewContent {
  completeness: CompletenessReview
  accuracy: AccuracyReview
  clarity: ClarityReview
  logical_consistency: LogicalConsistencyReview
  gaps_and_improvements: GapAndImprovement[]
}

interface OverallAssessment {
  score: number
  status: string
  summary: string
}

interface MemoReviewResult {
  review: ReviewContent
  overall_assessment: OverallAssessment
}

// Memo Evaluation Agent Response
interface ScoreWithReasoning {
  score: number
  reasoning: string
}

interface MemoEvaluationResult {
  investment_quality_score: ScoreWithReasoning
  risk_assessment_score: ScoreWithReasoning
  documentation_score: ScoreWithReasoning
  recommendation_strength_score: ScoreWithReasoning
  overall_rating: string
  recommendations: string[]
  actionable_next_steps: string[]
  decision_guidance: string
}

// Local storage types
interface SavedMemo {
  id: string
  customer_name: string
  investment_type: string
  amount: number
  terms: string
  market_context: string
  status: 'draft' | 'in_review' | 'evaluated' | 'archived'
  created_at: string
  updated_at: string
  memo_content?: MemoCreationResult
  review_content?: MemoReviewResult
  evaluation_content?: MemoEvaluationResult
}

// Investment form data
interface InvestmentFormData {
  customer_name: string
  investment_type: string
  amount: string
  terms: string
  market_context: string
}

// Get status badge color
function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'bg-gray-500'
    case 'in_review': return 'bg-blue-500'
    case 'evaluated': return 'bg-green-500'
    case 'archived': return 'bg-gray-400'
    default: return 'bg-gray-500'
  }
}

// Get severity badge color
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high': return 'bg-red-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

// Get priority badge color
function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high': return 'bg-red-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Dashboard component
function Dashboard({
  memos,
  onNavigate
}: {
  memos: SavedMemo[]
  onNavigate: (screen: string, memoId?: string) => void
}) {
  const drafts = memos.filter(m => m.status === 'draft')
  const inReview = memos.filter(m => m.status === 'in_review')
  const evaluated = memos.filter(m => m.status === 'evaluated')
  const recentMemos = [...memos].sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ).slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Investment Memo Dashboard</h1>
        <Button
          onClick={() => onNavigate('create')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Memo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-300 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-gray-400" />
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{drafts.length}</div>
            <p className="text-sm text-gray-400 mt-1">Pending memos</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-300 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-400" />
              In Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{inReview.length}</div>
            <p className="text-sm text-gray-400 mt-1">Under analysis</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-gray-300 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
              Evaluated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{evaluated.length}</div>
            <p className="text-sm text-gray-400 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Memos</CardTitle>
          <CardDescription className="text-gray-400">Latest investment memo activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMemos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-600 mb-3" />
              <p className="text-gray-400">No memos yet. Create your first memo to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Customer</TableHead>
                  <TableHead className="text-gray-300">Investment Type</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Updated</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMemos.map((memo) => (
                  <TableRow key={memo.id} className="border-gray-700">
                    <TableCell className="text-white font-medium">{memo.customer_name}</TableCell>
                    <TableCell className="text-gray-300">{memo.investment_type}</TableCell>
                    <TableCell className="text-gray-300">{formatCurrency(memo.amount)}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-white', getStatusColor(memo.status))}>
                        {memo.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(memo.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {memo.status === 'draft' && memo.memo_content && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate('review', memo.id)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        )}
                        {memo.status === 'in_review' && memo.review_content && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate('evaluate', memo.id)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <BarChart className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigate('create', memo.id)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Create Memo Screen
function CreateMemoScreen({
  onNavigate,
  memos,
  setMemos,
  editMemoId
}: {
  onNavigate: (screen: string) => void
  memos: SavedMemo[]
  setMemos: (memos: SavedMemo[]) => void
  editMemoId?: string
}) {
  const editMemo = editMemoId ? memos.find(m => m.id === editMemoId) : undefined

  const [formData, setFormData] = useState<InvestmentFormData>({
    customer_name: editMemo?.customer_name || '',
    investment_type: editMemo?.investment_type || '',
    amount: editMemo?.amount?.toString() || '',
    terms: editMemo?.terms || '',
    market_context: editMemo?.market_context || ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memoResult, setMemoResult] = useState<MemoCreationResult | null>(editMemo?.memo_content || null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    const message = `Create investment memo for customer ${formData.customer_name}. Investment type: ${formData.investment_type}. Amount: $${formData.amount}. Terms: ${formData.terms}. Market context: ${formData.market_context}.`

    try {
      const result = await callAIAgent(message, MEMO_CREATION_AGENT_ID)

      if (result.success && result.response.status === 'success') {
        setMemoResult(result.response.result as MemoCreationResult)
      } else {
        setError(result.error || result.response.message || 'Failed to generate memo')
      }
    } catch (e) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!memoResult) return

    const now = new Date().toISOString()
    const savedMemo: SavedMemo = {
      id: editMemoId || `memo-${Date.now()}`,
      customer_name: formData.customer_name,
      investment_type: formData.investment_type,
      amount: parseFloat(formData.amount),
      terms: formData.terms,
      market_context: formData.market_context,
      status: 'draft',
      created_at: editMemo?.created_at || now,
      updated_at: now,
      memo_content: memoResult
    }

    const updatedMemos = editMemoId
      ? memos.map(m => m.id === editMemoId ? savedMemo : m)
      : [...memos, savedMemo]

    setMemos(updatedMemos)
    localStorage.setItem('investment_memos', JSON.stringify(updatedMemos))

    onNavigate('dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">
            {editMemoId ? 'Edit' : 'Create'} Investment Memo
          </h1>
        </div>
        {memoResult && (
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Investment Details</CardTitle>
            <CardDescription className="text-gray-400">
              Enter the investment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name" className="text-gray-300">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="e.g., John Smith"
                className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment_type" className="text-gray-300">Investment Type</Label>
              <Select
                value={formData.investment_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, investment_type: value }))}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="Series A Equity">Series A Equity</SelectItem>
                  <SelectItem value="Series B Equity">Series B Equity</SelectItem>
                  <SelectItem value="Series C Equity">Series C Equity</SelectItem>
                  <SelectItem value="Debt Financing">Debt Financing</SelectItem>
                  <SelectItem value="Convertible Note">Convertible Note</SelectItem>
                  <SelectItem value="SAFE">SAFE</SelectItem>
                  <SelectItem value="Bridge Round">Bridge Round</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-300">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="e.g., 5000000"
                className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms" className="text-gray-300">Terms</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="e.g., 20% equity stake, 2 board seats, preferred shares"
                rows={4}
                className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market_context" className="text-gray-300">Market Context</Label>
              <Textarea
                id="market_context"
                value={formData.market_context}
                onChange={(e) => setFormData(prev => ({ ...prev, market_context: e.target.value }))}
                placeholder="e.g., Fast-growing SaaS company in healthcare vertical..."
                rows={6}
                className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !formData.customer_name || !formData.investment_type || !formData.amount}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Memo...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Memo
                </>
              )}
            </Button>

            {error && (
              <Alert className="bg-red-900/20 border-red-700">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-red-300">Error</AlertTitle>
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Memo Preview</CardTitle>
            <CardDescription className="text-gray-400">
              Generated investment memo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {!memoResult ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">Generate a memo to see preview</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">Completeness Score</h3>
                      <Badge className="bg-blue-600 text-white">{memoResult.completeness_score}%</Badge>
                    </div>
                    <Progress value={memoResult.completeness_score} className="h-2" />
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Executive Summary</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{memoResult.memo.executive_summary}</p>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Investment Thesis</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{memoResult.memo.investment_thesis}</p>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Risk Analysis</h3>
                    <div className="space-y-3">
                      {memoResult.memo.risk_analysis.risks.map((risk, idx) => (
                        <div key={idx} className="bg-gray-900/50 p-3 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-white">{risk.risk_type}</h4>
                            <Badge className={cn('text-white text-xs', getSeverityColor(risk.severity))}>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{risk.description}</p>
                        </div>
                      ))}
                      <div className="mt-4">
                        <h4 className="font-medium text-white mb-2">Mitigation Strategies</h4>
                        <ul className="space-y-1">
                          {memoResult.memo.risk_analysis.mitigation_strategies.map((strategy, idx) => (
                            <li key={idx} className="text-sm text-gray-400 flex items-start">
                              <span className="mr-2 text-blue-400">•</span>
                              {strategy}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Financial Projections</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-white mb-2">Revenue Forecast</h4>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-700">
                              <TableHead className="text-gray-300">Year</TableHead>
                              <TableHead className="text-gray-300">Revenue</TableHead>
                              <TableHead className="text-gray-300">Growth Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {memoResult.memo.financial_projections.revenue_forecast.map((forecast, idx) => (
                              <TableRow key={idx} className="border-gray-700">
                                <TableCell className="text-white">{forecast.year}</TableCell>
                                <TableCell className="text-white">{formatCurrency(forecast.amount)}</TableCell>
                                <TableCell className="text-green-400">{forecast.growth_rate}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-2">Key Metrics</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {memoResult.memo.financial_projections.key_metrics.map((metric, idx) => (
                            <div key={idx} className="bg-gray-900/50 p-3 rounded-lg">
                              <p className="text-xs text-gray-400">{metric.metric_name}</p>
                              <p className="text-lg font-semibold text-white mt-1">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                    <div className="space-y-3">
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">Action</h4>
                          <Badge className={cn('text-white',
                            memoResult.memo.recommendations.action.toLowerCase() === 'invest'
                              ? 'bg-green-600'
                              : 'bg-red-600'
                          )}>
                            {memoResult.memo.recommendations.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300">{memoResult.memo.recommendations.rationale}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-2">Conditions</h4>
                        <ul className="space-y-1">
                          {memoResult.memo.recommendations.conditions.map((condition, idx) => (
                            <li key={idx} className="text-sm text-gray-400 flex items-start">
                              <span className="mr-2 text-blue-400">•</span>
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Review Memo Screen
function ReviewMemoScreen({
  onNavigate,
  memos,
  setMemos,
  reviewMemoId
}: {
  onNavigate: (screen: string) => void
  memos: SavedMemo[]
  setMemos: (memos: SavedMemo[]) => void
  reviewMemoId?: string
}) {
  const draftMemos = memos.filter(m => m.status === 'draft' && m.memo_content)
  const [selectedMemoId, setSelectedMemoId] = useState<string>(reviewMemoId || '')
  const selectedMemo = memos.find(m => m.id === selectedMemoId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<MemoReviewResult | null>(
    selectedMemo?.review_content || null
  )

  useEffect(() => {
    if (selectedMemo?.review_content) {
      setReviewResult(selectedMemo.review_content)
    }
  }, [selectedMemo])

  const handleReview = async () => {
    if (!selectedMemo?.memo_content) return

    setLoading(true)
    setError(null)

    const memo = selectedMemo.memo_content.memo
    const message = `Review this investment memo: Executive Summary: ${memo.executive_summary}. Investment Thesis: ${memo.investment_thesis}. Risks: ${memo.risk_analysis.risks.map(r => r.risk_type).join(', ')}. Financial Projections: ${memo.financial_projections.revenue_forecast.map(f => `${f.year}: ${formatCurrency(f.amount)}`).join(', ')}. Recommendation: ${memo.recommendations.action}.`

    try {
      const result = await callAIAgent(message, MEMO_REVIEW_AGENT_ID)

      if (result.success && result.response.status === 'success') {
        const reviewData = result.response.result as MemoReviewResult
        setReviewResult(reviewData)

        const updatedMemo = {
          ...selectedMemo,
          status: 'in_review' as const,
          review_content: reviewData,
          updated_at: new Date().toISOString()
        }

        const updatedMemos = memos.map(m => m.id === selectedMemoId ? updatedMemo : m)
        setMemos(updatedMemos)
        localStorage.setItem('investment_memos', JSON.stringify(updatedMemos))
      } else {
        setError(result.error || result.response.message || 'Failed to review memo')
      }
    } catch (e) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('dashboard')}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-white">Review Investment Memo</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Select Memo</CardTitle>
            <CardDescription className="text-gray-400">
              Choose a draft memo to review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Draft Memos</Label>
              <Select
                value={selectedMemoId}
                onValueChange={setSelectedMemoId}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select a memo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {draftMemos.map(memo => (
                    <SelectItem key={memo.id} value={memo.id}>
                      {memo.customer_name} - {memo.investment_type} - {formatCurrency(memo.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMemo && (
              <>
                <Separator className="bg-gray-700" />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Memo Summary</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer:</span>
                      <span className="text-white font-medium">{selectedMemo.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investment:</span>
                      <span className="text-white font-medium">{selectedMemo.investment_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-medium">{formatCurrency(selectedMemo.amount)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleReview}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reviewing Memo...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Review Memo
                    </>
                  )}
                </Button>

                {error && (
                  <Alert className="bg-red-900/20 border-red-700">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertTitle className="text-red-300">Error</AlertTitle>
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Review Results</CardTitle>
            <CardDescription className="text-gray-400">
              Analysis and feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {!reviewResult ? (
                <div className="text-center py-12">
                  <Search className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">Select a memo and review to see results</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Overall Assessment</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Overall Score</span>
                        <Badge className={cn('text-white text-lg px-3 py-1',
                          reviewResult.overall_assessment.score >= 75 ? 'bg-green-600' :
                          reviewResult.overall_assessment.score >= 50 ? 'bg-yellow-600' :
                          'bg-red-600'
                        )}>
                          {reviewResult.overall_assessment.score}
                        </Badge>
                      </div>
                      <Progress value={reviewResult.overall_assessment.score} className="h-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status</span>
                        <Badge className={cn('text-white',
                          reviewResult.overall_assessment.status === 'approved' ? 'bg-green-600' :
                          reviewResult.overall_assessment.status === 'needs_revision' ? 'bg-yellow-600' :
                          'bg-red-600'
                        )}>
                          {reviewResult.overall_assessment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{reviewResult.overall_assessment.summary}</p>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Completeness</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Score</span>
                        <Badge className="bg-blue-600 text-white">{reviewResult.review.completeness.score}%</Badge>
                      </div>
                      <Progress value={reviewResult.review.completeness.score} className="h-2" />
                      <p className="text-sm text-gray-300">{reviewResult.review.completeness.comments}</p>
                      {reviewResult.review.completeness.missing_elements.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-2 text-sm">Missing Elements:</h4>
                          <ul className="space-y-1">
                            {reviewResult.review.completeness.missing_elements.map((element, idx) => (
                              <li key={idx} className="text-xs text-gray-400 flex items-start">
                                <XCircle className="mr-2 h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                                {element}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Accuracy</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Score</span>
                        <Badge className="bg-blue-600 text-white">{reviewResult.review.accuracy.score}%</Badge>
                      </div>
                      <Progress value={reviewResult.review.accuracy.score} className="h-2" />
                      <p className="text-sm text-gray-300">{reviewResult.review.accuracy.comments}</p>
                      {reviewResult.review.accuracy.issues_found.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-2 text-sm">Issues Found:</h4>
                          <div className="space-y-2">
                            {reviewResult.review.accuracy.issues_found.map((issue, idx) => (
                              <div key={idx} className="bg-gray-800/50 p-3 rounded">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="text-xs text-gray-400">{issue.location}</span>
                                  <Badge className={cn('text-white text-xs', getSeverityColor(issue.severity))}>
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-300">{issue.issue}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Clarity</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Score</span>
                        <Badge className="bg-blue-600 text-white">{reviewResult.review.clarity.score}%</Badge>
                      </div>
                      <Progress value={reviewResult.review.clarity.score} className="h-2" />
                      <p className="text-sm text-gray-300">{reviewResult.review.clarity.comments}</p>
                      {reviewResult.review.clarity.unclear_sections.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-2 text-sm">Unclear Sections:</h4>
                          <ul className="space-y-1">
                            {reviewResult.review.clarity.unclear_sections.map((section, idx) => (
                              <li key={idx} className="text-xs text-gray-400 flex items-start">
                                <AlertCircle className="mr-2 h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                                {section}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Logical Consistency</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Score</span>
                        <Badge className="bg-blue-600 text-white">{reviewResult.review.logical_consistency.score}%</Badge>
                      </div>
                      <Progress value={reviewResult.review.logical_consistency.score} className="h-2" />
                      <p className="text-sm text-gray-300">{reviewResult.review.logical_consistency.comments}</p>
                      {reviewResult.review.logical_consistency.inconsistencies.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-2 text-sm">Inconsistencies:</h4>
                          <div className="space-y-2">
                            {reviewResult.review.logical_consistency.inconsistencies.map((inconsistency, idx) => (
                              <div key={idx} className="bg-gray-800/50 p-3 rounded">
                                <p className="text-xs text-gray-300 mb-1">{inconsistency.issue}</p>
                                <p className="text-xs text-gray-400 italic">{inconsistency.impact}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Gaps & Improvements</h3>
                    <div className="space-y-3">
                      {reviewResult.review.gaps_and_improvements.map((gap, idx) => (
                        <div key={idx} className="bg-gray-900/50 p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-white">{gap.area}</h4>
                            <Badge className={cn('text-white text-xs', getPriorityColor(gap.priority))}>
                              {gap.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-2"><strong>Gap:</strong> {gap.gap}</p>
                          <p className="text-xs text-gray-300"><strong>Recommendation:</strong> {gap.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Evaluate Memo Screen
function EvaluateMemoScreen({
  onNavigate,
  memos,
  setMemos,
  evaluateMemoId
}: {
  onNavigate: (screen: string) => void
  memos: SavedMemo[]
  setMemos: (memos: SavedMemo[]) => void
  evaluateMemoId?: string
}) {
  const reviewedMemos = memos.filter(m => m.status === 'in_review' && m.review_content)
  const [selectedMemoId, setSelectedMemoId] = useState<string>(evaluateMemoId || '')
  const selectedMemo = memos.find(m => m.id === selectedMemoId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluationResult, setEvaluationResult] = useState<MemoEvaluationResult | null>(
    selectedMemo?.evaluation_content || null
  )

  useEffect(() => {
    if (selectedMemo?.evaluation_content) {
      setEvaluationResult(selectedMemo.evaluation_content)
    }
  }, [selectedMemo])

  const handleEvaluate = async () => {
    if (!selectedMemo?.memo_content) return

    setLoading(true)
    setError(null)

    const memo = selectedMemo.memo_content.memo
    const message = `Evaluate this investment memo: ${selectedMemo.investment_type} ${formatCurrency(selectedMemo.amount)} investment for ${selectedMemo.terms.split(',')[0]}. Comprehensive thesis covers ${memo.investment_thesis.substring(0, 100)}... Detailed risk analysis with ${memo.risk_analysis.risks.length} risks and mitigation strategies. ${memo.financial_projections.revenue_forecast.length}-year financial model with conservative assumptions. ${memo.recommendations.action} recommendation with clear exit strategy.`

    try {
      const result = await callAIAgent(message, MEMO_EVALUATION_AGENT_ID)

      if (result.success && result.response.status === 'success') {
        const evalData = result.response.result as MemoEvaluationResult
        setEvaluationResult(evalData)

        const updatedMemo = {
          ...selectedMemo,
          status: 'evaluated' as const,
          evaluation_content: evalData,
          updated_at: new Date().toISOString()
        }

        const updatedMemos = memos.map(m => m.id === selectedMemoId ? updatedMemo : m)
        setMemos(updatedMemos)
        localStorage.setItem('investment_memos', JSON.stringify(updatedMemos))
      } else {
        setError(result.error || result.response.message || 'Failed to evaluate memo')
      }
    } catch (e) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating: string): string => {
    switch (rating.toLowerCase()) {
      case 'buy': return 'bg-green-600'
      case 'hold': return 'bg-yellow-600'
      case 'pass': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('dashboard')}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-white">Evaluate Investment Memo</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Select Memo</CardTitle>
            <CardDescription className="text-gray-400">
              Choose a reviewed memo to evaluate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Reviewed Memos</Label>
              <Select
                value={selectedMemoId}
                onValueChange={setSelectedMemoId}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select a memo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {reviewedMemos.map(memo => (
                    <SelectItem key={memo.id} value={memo.id}>
                      {memo.customer_name} - {memo.investment_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMemo && (
              <>
                <Separator className="bg-gray-700" />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Memo Details</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer:</span>
                      <span className="text-white font-medium">{selectedMemo.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investment:</span>
                      <span className="text-white font-medium">{selectedMemo.investment_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-medium">{formatCurrency(selectedMemo.amount)}</span>
                    </div>
                    {selectedMemo.review_content && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Review Score:</span>
                        <Badge className="bg-blue-600 text-white">
                          {selectedMemo.review_content.overall_assessment.score}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleEvaluate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <BarChart className="mr-2 h-4 w-4" />
                      Evaluate Memo
                    </>
                  )}
                </Button>

                {error && (
                  <Alert className="bg-red-900/20 border-red-700">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertTitle className="text-red-300">Error</AlertTitle>
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Evaluation Results</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive investment analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px] pr-4">
                {!evaluationResult ? (
                  <div className="text-center py-12">
                    <BarChart className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                    <p className="text-gray-400">Select a memo and evaluate to see results</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Overall Rating</h3>
                      <Badge className={cn('text-white text-2xl px-6 py-3', getRatingColor(evaluationResult.overall_rating))}>
                        {evaluationResult.overall_rating}
                      </Badge>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white text-base">Investment Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-white">
                              {evaluationResult.investment_quality_score.score}
                            </span>
                            <TrendingUp className="h-6 w-6 text-blue-400" />
                          </div>
                          <Progress value={evaluationResult.investment_quality_score.score} className="h-2 mb-3" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {evaluationResult.investment_quality_score.reasoning}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white text-base">Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-white">
                              {evaluationResult.risk_assessment_score.score}
                            </span>
                            <AlertCircle className="h-6 w-6 text-yellow-400" />
                          </div>
                          <Progress value={evaluationResult.risk_assessment_score.score} className="h-2 mb-3" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {evaluationResult.risk_assessment_score.reasoning}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white text-base">Documentation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-white">
                              {evaluationResult.documentation_score.score}
                            </span>
                            <FileText className="h-6 w-6 text-green-400" />
                          </div>
                          <Progress value={evaluationResult.documentation_score.score} className="h-2 mb-3" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {evaluationResult.documentation_score.reasoning}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white text-base">Recommendation Strength</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-white">
                              {evaluationResult.recommendation_strength_score.score}
                            </span>
                            <CheckCircle className="h-6 w-6 text-purple-400" />
                          </div>
                          <Progress value={evaluationResult.recommendation_strength_score.score} className="h-2 mb-3" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {evaluationResult.recommendation_strength_score.reasoning}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Decision Guidance</h3>
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {evaluationResult.decision_guidance}
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                      <div className="space-y-2">
                        {evaluationResult.recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-gray-900/50 p-3 rounded-lg flex items-start">
                            <CheckCircle className="h-4 w-4 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Actionable Next Steps</h3>
                      <div className="space-y-2">
                        {evaluationResult.actionable_next_steps.map((step, idx) => (
                          <div key={idx} className="bg-gray-900/50 p-3 rounded-lg flex items-start">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-gray-300">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            {evaluationResult && (
              <CardFooter className="border-t border-gray-700">
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Evaluation Report
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// Main App Component
export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard')
  const [memos, setMemos] = useState<SavedMemo[]>([])
  const [selectedMemoId, setSelectedMemoId] = useState<string | undefined>(undefined)

  // Load memos from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('investment_memos')
    if (stored) {
      try {
        setMemos(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored memos')
      }
    }
  }, [])

  const handleNavigate = (screen: string, memoId?: string) => {
    setCurrentScreen(screen)
    setSelectedMemoId(memoId)
  }

  const updateMemos = (newMemos: SavedMemo[]) => {
    setMemos(newMemos)
    localStorage.setItem('investment_memos', JSON.stringify(newMemos))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 min-h-screen bg-gray-900/50 border-r border-gray-700 p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-1">Investment Memo</h2>
            <p className="text-sm text-gray-400">Manager</p>
          </div>

          <nav className="space-y-2">
            <Button
              variant={currentScreen === 'dashboard' ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                currentScreen === 'dashboard'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
              onClick={() => handleNavigate('dashboard')}
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            <Button
              variant={currentScreen === 'create' ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                currentScreen === 'create'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
              onClick={() => handleNavigate('create')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Memo
            </Button>

            <Button
              variant={currentScreen === 'review' ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                currentScreen === 'review'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
              onClick={() => handleNavigate('review')}
            >
              <Search className="mr-2 h-4 w-4" />
              Review Memo
            </Button>

            <Button
              variant={currentScreen === 'evaluate' ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                currentScreen === 'evaluate'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
              onClick={() => handleNavigate('evaluate')}
            >
              <BarChart className="mr-2 h-4 w-4" />
              Evaluate Memo
            </Button>

            <Separator className="bg-gray-700 my-4" />

            <div className="pt-2">
              <p className="text-xs text-gray-500 px-3 mb-2">STATISTICS</p>
              <div className="space-y-1 px-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Total Memos</span>
                  <span className="text-white font-medium">{memos.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Drafts</span>
                  <span className="text-white font-medium">
                    {memos.filter(m => m.status === 'draft').length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">In Review</span>
                  <span className="text-white font-medium">
                    {memos.filter(m => m.status === 'in_review').length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Evaluated</span>
                  <span className="text-white font-medium">
                    {memos.filter(m => m.status === 'evaluated').length}
                  </span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {currentScreen === 'dashboard' && (
            <Dashboard memos={memos} onNavigate={handleNavigate} />
          )}

          {currentScreen === 'create' && (
            <CreateMemoScreen
              onNavigate={handleNavigate}
              memos={memos}
              setMemos={updateMemos}
              editMemoId={selectedMemoId}
            />
          )}

          {currentScreen === 'review' && (
            <ReviewMemoScreen
              onNavigate={handleNavigate}
              memos={memos}
              setMemos={updateMemos}
              reviewMemoId={selectedMemoId}
            />
          )}

          {currentScreen === 'evaluate' && (
            <EvaluateMemoScreen
              onNavigate={handleNavigate}
              memos={memos}
              setMemos={updateMemos}
              evaluateMemoId={selectedMemoId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
