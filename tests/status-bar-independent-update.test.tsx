// ============================================
// tests/status-bar-independent-update.test.tsx
// ============================================

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { StatusBar } from '@/components/dashboard/status-bar'
import { useIndependentCacheStatus } from '@/hooks/use-independent-cache-status'

// Mock the hook
jest.mock('@/hooks/use-independent-cache-status', () => ({
  useIndependentCacheStatus: jest.fn()
}))

const mockUseIndependentCacheStatus = useIndependentCacheStatus as jest.MockedFunction<typeof useIndependentCacheStatus>

describe('StatusBar Independent Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show excellent status immediately on dashboard load', async () => {
    const mockCacheStatus = {
      isConnected: true,
      lastUpdated: Date.now(),
      cacheHealth: 'excellent' as const,
      dataFreshness: 100,
      status: 'excellent' as const,
      statusDetail: 'Real-time',
      responseTime: 0,
      dataAccuracy: 100
    }

    const mockMarkDashboardLoaded = jest.fn()

    mockUseIndependentCacheStatus.mockReturnValue({
      cacheStatus: mockCacheStatus,
      markDashboardLoaded: mockMarkDashboardLoaded,
      updateCacheStatus: jest.fn(),
      refreshStatus: jest.fn()
    })

    render(<StatusBar />)

    // Should immediately show excellent status
    expect(screen.getByText('Excellent')).toBeInTheDocument()
    
    // Should mark dashboard as loaded
    await waitFor(() => {
      expect(mockMarkDashboardLoaded).toHaveBeenCalledTimes(1)
    })

    // Should show real-time status
    expect(screen.getByText('Real-time')).toBeInTheDocument()
  })

  it('should show connection status with WiFi icon', () => {
    const mockCacheStatus = {
      isConnected: true,
      lastUpdated: Date.now(),
      cacheHealth: 'excellent' as const,
      dataFreshness: 100,
      status: 'excellent' as const,
      statusDetail: 'Real-time',
      responseTime: 0,
      dataAccuracy: 100
    }

    const mockMarkDashboardLoaded = jest.fn()

    mockUseIndependentCacheStatus.mockReturnValue({
      cacheStatus: mockCacheStatus,
      markDashboardLoaded: mockMarkDashboardLoaded,
      updateCacheStatus: jest.fn(),
      refreshStatus: jest.fn()
    })

    render(<StatusBar />)

    // Should show connection status
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('should update status from poor to excellent', async () => {
    let callCount = 0
    const mockUpdateCacheStatus = jest.fn()

    const getMockCacheStatus = (status: string) => ({
      isConnected: true,
      lastUpdated: Date.now(),
      cacheHealth: status === 'poor' ? 'poor' as const : 'excellent' as const,
      dataFreshness: status === 'poor' ? 10 : 100,
      status: status as any,
      statusDetail: status === 'poor' ? 'Very stale' : 'Real-time',
      responseTime: 0,
      dataAccuracy: status === 'poor' ? 20 : 100
    })

    // First render with poor status
    mockUseIndependentCacheStatus.mockReturnValue({
      cacheStatus: getMockCacheStatus('poor'),
      markDashboardLoaded: jest.fn(),
      updateCacheStatus: mockUpdateCacheStatus,
      refreshStatus: jest.fn()
    })

    const { rerender } = render(<StatusBar />)

    // Should initially show poor status
    expect(screen.getByText('Poor')).toBeInTheDocument()

    // Simulate magic card data loading - update to excellent
    mockUseIndependentCacheStatus.mockReturnValue({
      cacheStatus: getMockCacheStatus('excellent'),
      markDashboardLoaded: jest.fn(),
      updateCacheStatus: mockUpdateCacheStatus,
      refreshStatus: jest.fn()
    })

    rerender(<StatusBar />)

    // Should now show excellent status
    await waitFor(() => {
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })
  })

  it('should not depend on magic card data for initial status', () => {
    const mockCacheStatus = {
      isConnected: true,
      lastUpdated: Date.now(),
      cacheHealth: 'excellent' as const,
      dataFreshness: 100,
      status: 'excellent' as const,
      statusDetail: 'Real-time',
      responseTime: 0,
      dataAccuracy: 100
    }

    const mockMarkDashboardLoaded = jest.fn()

    mockUseIndependentCacheStatus.mockReturnValue({
      cacheStatus: mockCacheStatus,
      markDashboardLoaded: mockMarkDashboardLoaded,
      updateCacheStatus: jest.fn(),
      refreshStatus: jest.fn()
    })

    render(<StatusBar />)

    // Should show excellent status without any magic card data
    expect(screen.getByText('Excellent')).toBeInTheDocument()
    expect(screen.getByText('Real-time')).toBeInTheDocument()
    
    // Should NOT show loading states
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
  })
})

describe('Independent Cache Status Hook', () => {
  it('should initialize with excellent status', () => {
    const { result } = renderHook(() => useIndependentCacheStatus())
    
    expect(result.current.cacheStatus.status).toBe('excellent')
    expect(result.current.cacheStatus.statusDetail).toBe('Real-time')
    expect(result.current.cacheStatus.dataFreshness).toBe(100)
  })

  it('should update status when markDashboardLoaded is called', async () => {
    const { result } = renderHook(() => useIndependentCacheStatus())
    
    // Initially should be excellent
    expect(result.current.cacheStatus.status).toBe('excellent')
    
    // Call markDashboardLoaded
    act(() => {
      result.current.markDashboardLoaded()
    })
    
    // Should still be excellent and updated
    expect(result.current.cacheStatus.status).toBe('excellent')
    expect(result.current.cacheStatus.statusDetail).toBe('Real-time')
  })
})