/**
 * 🔥 Trace API Endpoints
 * 
 * REST API for querying agent decision traces and analytics.
 * Provides real-time observability for frontend dashboards.
 */

import { Router, Request, Response } from 'express';
import { traces, TraceAnalytics, AgentDecisionTrace } from '../observability/trace-system';

const router = Router();

/**
 * GET /api/traces
 * Get all traces with optional filtering
 */
router.get('/traces', (req: Request, res: Response) => {
  try {
    const { agent, status, limit } = req.query;
    
    let results: AgentDecisionTrace[] = traces.getAll();
    
    // Filter by agent type
    if (agent && typeof agent === 'string') {
      results = traces.getByAgent(agent);
    }
    
    // Filter by status
    if (status && typeof status === 'string') {
      results = traces.getByStatus(status as any);
    }
    
    // Limit results
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit);
      results = results.slice(0, limitNum);
    }
    
    res.json({
      success: true,
      count: results.length,
      traces: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/traces/recent
 * Get most recent traces
 */
router.get('/traces/recent', (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    const results = traces.getRecent(count);
    
    res.json({
      success: true,
      count: results.length,
      traces: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/traces/:traceId
 * Get specific trace by ID
 */
router.get('/traces/:traceId', (req: Request, res: Response) => {
  try {
    const { traceId } = req.params;
    const trace = traces.get(traceId);
    
    if (!trace) {
      return res.status(404).json({
        success: false,
        error: 'Trace not found'
      });
    }
    
    res.json({
      success: true,
      trace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/traces/analytics/summary
 * Get summary analytics
 */
router.get('/traces/analytics/summary', (req: Request, res: Response) => {
  try {
    const stats = TraceAnalytics.getSummaryStats();
    
    res.json({
      success: true,
      analytics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/traces/analytics/agent/:agentType
 * Get analytics for specific agent type
 */
router.get('/traces/analytics/agent/:agentType', (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    
    const avgTime = TraceAnalytics.getAverageExecutionTime(agentType);
    const successRate = TraceAnalytics.getSuccessRate(agentType);
    const avgGas = TraceAnalytics.getAverageGasUsed(agentType);
    const agentTraces = traces.getByAgent(agentType);
    
    res.json({
      success: true,
      agentType,
      analytics: {
        totalTraces: agentTraces.length,
        averageExecutionTime: avgTime,
        successRate,
        averageGasUsed: avgGas,
        recentTraces: agentTraces.slice(-10).map(t => ({
          traceId: t.traceId,
          status: t.status,
          duration: t.duration,
          gasUsed: t.performance.gasUsed
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/traces/analytics/performance
 * Get performance issues
 */
router.get('/traces/analytics/performance', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 1000;
    
    const slowTraces = TraceAnalytics.getSlowTraces(threshold);
    const gasInefficient = TraceAnalytics.getGasInefficientTraces(80);
    
    res.json({
      success: true,
      performance: {
        slowTraces: slowTraces.map(t => ({
          traceId: t.traceId,
          agentType: t.agentType,
          duration: t.duration,
          steps: t.steps.length
        })),
        gasInefficientTraces: gasInefficient.map(t => ({
          traceId: t.traceId,
          agentType: t.agentType,
          gasEfficiency: t.performance.gasEfficiency,
          expectedGas: t.finalDecision?.expectedGas,
          actualGas: t.performance.gasUsed
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/traces/analytics/timeline
 * Get timeline data for charts
 */
router.get('/traces/analytics/timeline', (req: Request, res: Response) => {
  try {
    const allTraces = traces.getAll();
    const hours = parseInt(req.query.hours as string) || 24;
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    const recentTraces = allTraces.filter(t => t.startTime >= cutoff);
    
    // Group by hour
    const timeline: { [hour: string]: { success: number; failed: number; avgGas: number } } = {};
    
    recentTraces.forEach(t => {
      const hour = new Date(t.startTime).toISOString().slice(0, 13) + ':00';
      
      if (!timeline[hour]) {
        timeline[hour] = { success: 0, failed: 0, avgGas: 0 };
      }
      
      if (t.status === 'success') {
        timeline[hour].success++;
      } else if (t.status === 'failed') {
        timeline[hour].failed++;
      }
      
      if (t.performance.gasUsed) {
        timeline[hour].avgGas += parseInt(t.performance.gasUsed);
      }
    });
    
    // Convert to array and calculate averages
    const timelineArray = Object.entries(timeline)
      .map(([timestamp, data]) => ({
        timestamp,
        success: data.success,
        failed: data.failed,
        total: data.success + data.failed,
        avgGas: data.avgGas > 0 ? Math.floor(data.avgGas / (data.success + data.failed)) : 0
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    res.json({
      success: true,
      timeline: timelineArray
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/traces
 * Clear all traces (admin only)
 */
router.delete('/traces', (req: Request, res: Response) => {
  try {
    traces.clear();
    
    res.json({
      success: true,
      message: 'All traces cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
