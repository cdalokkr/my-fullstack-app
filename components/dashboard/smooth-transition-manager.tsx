'use client'

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  DualLayerCoordinatorState,
  DualLayerCoordinatorStateData,
  DualLayerLoadingCoordinator
} from './dual-layer-loading-coordinator'
import {
  UserManagementSkeleton,
  UserManagementSkeletonVariant
} from './skeletons/user-management-skeleton'
import { UserOperationModalOverlay } from './user-operation-modal-overlay'

// ====================
// TRANSITION STATE TYPES
// ====================

export enum TransitionPhase {
  IDLE = 'idle',
  COORDINATING = 'coordinating',
  FADING_SKELETON = 'fading_skeleton',
  FADING_MODAL = 'fading_modal',
  REVEALING_CONTENT = 'revealing_content',
  COMPLETE = 'complete',
  INTERRUPTED = 'interrupted'
}

export interface TransitionConfig {
  // Animation durations (in milliseconds)
  skeletonFadeDuration: number
  modalFadeDuration: number
  contentRevealDelay: number
  rowStaggerDelay: number
  headerRevealDelay: number
  
  // Timing coordination
  modalStartDelay: number
  skeletonStartDelay: number
  contentStartDelay: number
  
  // Performance settings
  enableHardwareAcceleration: boolean
  enableReducedMotion: boolean
  enableStaggeredReveal: boolean
  
  // Accessibility
  respectReducedMotion: boolean
  announceToScreenReader: boolean
}

export interface TransitionMetrics {
  startTime: number
  skeletonFadeStart: number
  skeletonFadeComplete: number
  modalFadeStart: number
  modalFadeComplete: number
  contentRevealStart: number
  contentRevealComplete: number
  totalDuration: number
  phaseTimes: Record<TransitionPhase, number>
}

// ====================
// DEFAULT CONFIGURATION
// ====================

const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  skeletonFadeDuration: 300,
  modalFadeDuration: 250,
  contentRevealDelay: 200,
  rowStaggerDelay: 50,
  headerRevealDelay: 100,
  modalStartDelay: 0,
  skeletonStartDelay: 50,
  contentStartDelay: 450,
  enableHardwareAcceleration: true,
  enableReducedMotion: false,
  enableStaggeredReveal: true,
  respectReducedMotion: true,
  announceToScreenReader: true
}

// ====================
// HOOK FOR TRANSITION COORDINATION
// ====================

function useTransitionCoordinator(
  coordinatorState: DualLayerCoordinatorStateData,
  config: TransitionConfig
) {
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>(TransitionPhase.IDLE)
  const [metrics, setMetrics] = useState<TransitionMetrics | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [interrupted, setInterrupted] = useState(false)
  
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const previousStateRef = useRef<DualLayerCoordinatorState>(coordinatorState.currentState)
  const transitionStartRef = useRef<number>(0)

  // Detect state changes that should trigger transitions
  const shouldStartTransition = useMemo(() => {
    const wasLoading = previousStateRef.current !== DualLayerCoordinatorState.READY
    const isNowReady = coordinatorState.currentState === DualLayerCoordinatorState.READY
    return wasLoading && isNowReady && !isTransitioning
  }, [coordinatorState.currentState, isTransitioning])

  // Check for interruptions
  const wasInterrupted = useMemo(() => {
    const currentReady = coordinatorState.currentState === DualLayerCoordinatorState.READY
    const wasTransitioning = isTransitioning && !currentReady
    return wasTransitioning && previousStateRef.current === DualLayerCoordinatorState.READY
  }, [coordinatorState.currentState, isTransitioning])

  // Clear all timers
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  // Set timer with cleanup
  const setTransitionTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    timersRef.current.add(timer)
    return timer
  }, [])

  // Initialize transition metrics
  const startMetrics = useCallback(() => {
    const now = Date.now()
    const newMetrics: TransitionMetrics = {
      startTime: now,
      skeletonFadeStart: 0,
      skeletonFadeComplete: 0,
      modalFadeStart: 0,
      modalFadeComplete: 0,
      contentRevealStart: 0,
      contentRevealComplete: 0,
      totalDuration: 0,
      phaseTimes: {
        [TransitionPhase.IDLE]: 0,
        [TransitionPhase.COORDINATING]: 0,
        [TransitionPhase.FADING_SKELETON]: 0,
        [TransitionPhase.FADING_MODAL]: 0,
        [TransitionPhase.REVEALING_CONTENT]: 0,
        [TransitionPhase.COMPLETE]: 0,
        [TransitionPhase.INTERRUPTED]: 0
      }
    }
    setMetrics(newMetrics)
    transitionStartRef.current = now
    return newMetrics
  }, [])

  // Update metrics
  const updateMetrics = useCallback((phase: TransitionPhase, timestamp?: number) => {
    setMetrics(prev => {
      if (!prev) return null
      const now = timestamp || Date.now()
      const updated = { ...prev }
      const phaseStart = prev.phaseTimes[phase] || prev.startTime
      
      updated.phaseTimes[phase] = now - phaseStart
      
      switch (phase) {
        case TransitionPhase.FADING_SKELETON:
          updated.skeletonFadeStart = now
          break
        case TransitionPhase.FADING_MODAL:
          updated.modalFadeStart = now
          break
        case TransitionPhase.REVEALING_CONTENT:
          updated.contentRevealStart = now
          break
        case TransitionPhase.COMPLETE:
          updated.totalDuration = now - prev.startTime
          break
      }
      
      return updated
    })
  }, [])

  // Main transition coordinator
  const coordinateTransition = useCallback(() => {
    if (config.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Skip animations for reduced motion preference
      setTransitionPhase(TransitionPhase.COMPLETE)
      return
    }

    startMetrics()
    setIsTransitioning(true)
    setInterrupted(false)
    setTransitionPhase(TransitionPhase.COORDINATING)
    updateMetrics(TransitionPhase.COORDINATING)

    // Phase 1: Start skeleton fade (after initial delay)
    setTransitionTimer(() => {
      setTransitionPhase(TransitionPhase.FADING_SKELETON)
      updateMetrics(TransitionPhase.FADING_SKELETON)
    }, config.skeletonStartDelay)

    // Phase 2: Start modal fade (starts immediately)
    setTransitionTimer(() => {
      setTransitionPhase(TransitionPhase.FADING_MODAL)
      updateMetrics(TransitionPhase.FADING_MODAL)
    }, config.modalStartDelay)

    // Phase 3: Start content reveal (after both layers begin fading)
    setTransitionTimer(() => {
      setTransitionPhase(TransitionPhase.REVEALING_CONTENT)
      updateMetrics(TransitionPhase.REVEALING_CONTENT)
    }, config.contentStartDelay)

    // Phase 4: Complete transition
    const totalDelay = Math.max(
      config.skeletonStartDelay + config.skeletonFadeDuration,
      config.modalStartDelay + config.modalFadeDuration,
      config.contentStartDelay + 200
    )

    setTransitionTimer(() => {
      setTransitionPhase(TransitionPhase.COMPLETE)
      updateMetrics(TransitionPhase.COMPLETE)
      setIsTransitioning(false)
    }, totalDelay)
  }, [config, startMetrics, updateMetrics, setTransitionTimer])

  // Handle interruption
  const handleInterruption = useCallback(() => {
    setInterrupted(true)
    setTransitionPhase(TransitionPhase.INTERRUPTED)
    updateMetrics(TransitionPhase.INTERRUPTED)
    clearTimers()
    setIsTransitioning(false)
  }, [clearTimers, updateMetrics])

  // Effect to handle state changes
  useEffect(() => {
    if (shouldStartTransition) {
      coordinateTransition()
    } else if (wasInterrupted) {
      handleInterruption()
    }
    
    previousStateRef.current = coordinatorState.currentState
  }, [shouldStartTransition, wasInterrupted, coordinateTransition, handleInterruption])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return {
    transitionPhase,
    metrics,
    isTransitioning,
    interrupted,
    shouldStartTransition: !coordinatorState.isLayer1Visible && !coordinatorState.isLayer2Visible
  }
}

// ====================
// MAIN COMPONENT
// ====================

export interface SmoothTransitionManagerProps {
  // Coordinator state
  coordinatorState: DualLayerCoordinatorStateData
  
  // Content to render
  children: React.ReactNode
  
  // Configuration
  config?: Partial<TransitionConfig>
  
  // Callbacks
  onTransitionStart?: () => void
  onTransitionComplete?: (metrics: TransitionMetrics) => void
  onTransitionInterrupted?: () => void
  onPhaseChange?: (phase: TransitionPhase) => void
  
  // Styling
  className?: string
  skeletonClassName?: string
  modalClassName?: string
  contentClassName?: string
  
  // Accessibility
  ariaLabel?: string
  skeletonAriaLabel?: string
  contentAriaLabel?: string
  
  // Performance
  enablePerformanceMonitoring?: boolean
}

export function SmoothTransitionManager({
  coordinatorState,
  children,
  config = {},
  onTransitionStart,
  onTransitionComplete,
  onTransitionInterrupted,
  onPhaseChange,
  className,
  skeletonClassName,
  modalClassName,
  contentClassName,
  ariaLabel = 'User management interface',
  skeletonAriaLabel = 'Loading user management interface',
  contentAriaLabel = 'User management content',
  enablePerformanceMonitoring = false
}: SmoothTransitionManagerProps) {
  // Merge configurations
  const transitionConfig = useMemo(() => ({
    ...DEFAULT_TRANSITION_CONFIG,
    ...config
  }), [config])

  // Use transition coordination hook
  const {
    transitionPhase,
    metrics,
    isTransitioning,
    interrupted,
    shouldStartTransition
  } = useTransitionCoordinator(coordinatorState, transitionConfig)

  // Announce phase changes to screen readers
  useEffect(() => {
    if (transitionConfig.announceToScreenReader) {
      const announcement = `Transition ${transitionPhase.replace('_', ' ')}`
      // Create live region for announcements
      const announcementElement = document.createElement('div')
      announcementElement.setAttribute('aria-live', 'polite')
      announcementElement.setAttribute('aria-atomic', 'true')
      announcementElement.className = 'visually-hidden'
      announcementElement.textContent = announcement
      
      document.body.appendChild(announcementElement)
      
      setTimeout(() => {
        document.body.removeChild(announcementElement)
      }, 1000)
    }
  }, [transitionPhase, transitionConfig.announceToScreenReader])

  // Callbacks for phase changes
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(transitionPhase)
    }
  }, [transitionPhase, onPhaseChange])

  useEffect(() => {
    if (transitionPhase === TransitionPhase.COORDINATING && onTransitionStart) {
      onTransitionStart()
    }
  }, [transitionPhase, onTransitionStart])

  useEffect(() => {
    if (transitionPhase === TransitionPhase.COMPLETE && onTransitionComplete && metrics) {
      onTransitionComplete(metrics)
    }
  }, [transitionPhase, onTransitionComplete, metrics])

  useEffect(() => {
    if (transitionPhase === TransitionPhase.INTERRUPTED && onTransitionInterrupted) {
      onTransitionInterrupted()
    }
  }, [transitionPhase, onTransitionInterrupted])

  // Performance monitoring
  useEffect(() => {
    if (enablePerformanceMonitoring && metrics) {
      console.log('[SmoothTransitionManager] Transition metrics:', metrics)
    }
  }, [metrics, enablePerformanceMonitoring])

  // Get transition classes based on phase
  const getTransitionClasses = useCallback(() => {
    const classes = ['smooth-transition-manager', 'gpu-accelerated']
    
    switch (transitionPhase) {
      case TransitionPhase.FADING_SKELETON:
        classes.push('skeleton-fading')
        break
      case TransitionPhase.FADING_MODAL:
        classes.push('modal-fading')
        break
      case TransitionPhase.REVEALING_CONTENT:
        classes.push('content-revealing')
        break
      case TransitionPhase.COMPLETE:
        classes.push('transition-complete')
        break
    }
    
    if (transitionConfig.enableHardwareAcceleration) {
      classes.push('gpu-accelerated')
    }
    
    return classes
  }, [transitionPhase, transitionConfig.enableHardwareAcceleration])

  // Render skeleton with transition classes
  const renderSkeleton = () => {
    if (!coordinatorState.isLayer1Visible) return null
    
    const skeletonClasses = [
      'coordinated-fade-layer-1',
      'skeleton-fade-out',
      skeletonClassName,
      transitionConfig.enableHardwareAcceleration && 'gpu-accelerated'
    ].filter(Boolean).join(' ')
    
    return (
      <div 
        className={cn(skeletonClasses, getTransitionClasses())}
        style={{ zIndex: 1 }}
        aria-hidden={!coordinatorState.isLayer1Visible}
      >
        <UserManagementSkeleton
          ariaLabel={skeletonAriaLabel}
          variant={UserManagementSkeletonVariant.STANDARD}
          rowCount={8}
          showHeader={true}
          showSearchBar={true}
          showFilters={true}
          showCreateButton={true}
          showActions={true}
          showPagination={true}
        />
      </div>
    )
  }

  // Render modal with transition classes
  const renderModal = () => {
    if (!coordinatorState.isLayer2Visible) return null
    
    const modalClasses = [
      'coordinated-fade-layer-2',
      'modal-fade-out',
      modalClassName,
      transitionConfig.enableHardwareAcceleration && 'gpu-accelerated'
    ].filter(Boolean).join(' ')
    
    return (
      <div 
        className={cn('fixed inset-0 z-50', modalClasses, getTransitionClasses())}
        style={{ zIndex: 10000 }}
      >
        <UserOperationModalOverlay
          isVisible={coordinatorState.isLayer2Visible}
          state={coordinatorState.modalState}
          zIndex={10000}
          showProgress={coordinatorState.showProgress}
          customMessage={coordinatorState.customMessage}
          customDescription={coordinatorState.customDescription}
          priority={coordinatorState.priority}
        />
      </div>
    )
  }

  // Render content with transition classes
  const renderContent = () => {
    if (coordinatorState.isLayer1Visible || coordinatorState.isLayer2Visible) return null
    
    const contentClasses = [
      'coordinated-fade-content',
      'content-reveal',
      'stagger-container',
      contentClassName,
      transitionConfig.enableHardwareAcceleration && 'gpu-accelerated'
    ].filter(Boolean).join(' ')
    
    return (
      <div 
        className={cn(contentClasses, getTransitionClasses())}
        style={{ zIndex: 2 }}
        role="main"
        aria-label={contentAriaLabel}
      >
        {children}
      </div>
    )
  }

  // Render performance indicator (debug mode)
  const renderPerformanceIndicator = () => {
    if (!enablePerformanceMonitoring || !metrics) return null
    
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded text-xs font-mono z-[10001] space-y-1">
        <div>Phase: {transitionPhase}</div>
        <div>Duration: {metrics.totalDuration}ms</div>
        <div>Interrupted: {interrupted ? 'Yes' : 'No'}</div>
        <div>Hardware Accel: {transitionConfig.enableHardwareAcceleration ? 'Yes' : 'No'}</div>
      </div>
    )
  }

  return (
    <div 
      className={cn(getTransitionClasses(), className)}
      role="region"
      aria-label={ariaLabel}
      data-transition-phase={transitionPhase}
      data-transition-config={JSON.stringify(transitionConfig)}
    >
      {/* Layer 1: Skeleton */}
      {renderSkeleton()}

      {/* Layer 2: Modal */}
      {renderModal()}

      {/* Layer 3: Actual Content */}
      {renderContent()}

      {/* Performance Monitoring */}
      {renderPerformanceIndicator()}
    </div>
  )
}

// ====================
// CONVENIENCE HOOK
// ====================

export function useTransitionState(coordinatorState: DualLayerCoordinatorStateData) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [metrics, setMetrics] = useState<TransitionMetrics | null>(null)
  
  // Use the internal hook logic
  const transition = useTransitionCoordinator(coordinatorState, DEFAULT_TRANSITION_CONFIG)
  
  return {
    ...transition,
    isTransitioning: transition.isTransitioning,
    metrics: transition.metrics,
    shouldStartContentReveal: transition.shouldStartTransition
  }
}

// ====================
// PRE-CONFIGURED COMPONENTS
// ====================

export function StandardSmoothTransitionManager(props: Omit<SmoothTransitionManagerProps, 'config'>) {
  return (
    <SmoothTransitionManager
      {...props}
      config={{
        skeletonFadeDuration: 300,
        modalFadeDuration: 250,
        contentRevealDelay: 200,
        rowStaggerDelay: 50,
        enableStaggeredReveal: true,
        respectReducedMotion: true
      }}
    />
  )
}

export function FastSmoothTransitionManager(props: Omit<SmoothTransitionManagerProps, 'config'>) {
  return (
    <SmoothTransitionManager
      {...props}
      config={{
        skeletonFadeDuration: 150,
        modalFadeDuration: 150,
        contentRevealDelay: 100,
        rowStaggerDelay: 25,
        enableStaggeredReveal: true,
        respectReducedMotion: true
      }}
    />
  )
}

export function AccessibilityFocusedTransitionManager(props: Omit<SmoothTransitionManagerProps, 'config'>) {
  return (
    <SmoothTransitionManager
      {...props}
      config={{
        skeletonFadeDuration: 200,
        modalFadeDuration: 200,
        contentRevealDelay: 100,
        rowStaggerDelay: 75,
        enableStaggeredReveal: true,
        respectReducedMotion: true,
        announceToScreenReader: true
      }}
    />
  )
}

export default SmoothTransitionManager