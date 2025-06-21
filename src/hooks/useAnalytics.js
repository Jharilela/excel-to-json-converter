import { useCallback, useEffect } from 'react'

export const useAnalytics = () => {
  // Initialize Google Analytics with the environment variable
  useEffect(() => {
    const analyticsId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
    if (analyticsId && analyticsId !== 'G-XXXXXXXXXX' && typeof window !== 'undefined' && window.gtag) {
      // Update the config with the actual analytics ID
      window.gtag('config', analyticsId)
    }
  }, [])

  const trackEvent = useCallback((action, category = 'User Interaction', label = null, value = null) => {
    const analyticsId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
    if (analyticsId && analyticsId !== 'G-XXXXXXXXXX' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      })
    }
  }, [])

  const trackFileUpload = useCallback((fileType, fileSize) => {
    trackEvent('file_upload', 'File Upload', fileType, Math.round(fileSize / 1024 / 1024)) // Size in MB
  }, [trackEvent])

  const trackFileConversion = useCallback((fileCount, outputFormat) => {
    trackEvent('file_conversion', 'File Conversion', outputFormat, fileCount)
  }, [trackEvent])

  const trackDownload = useCallback((outputFormat, fileCount) => {
    trackEvent('file_download', 'File Download', outputFormat, fileCount)
  }, [trackEvent])

  const trackError = useCallback((errorType, errorMessage) => {
    trackEvent('error', 'Error', errorType, null)
  }, [trackEvent])

  const trackPageView = useCallback((pageName) => {
    const analyticsId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
    if (analyticsId && analyticsId !== 'G-XXXXXXXXXX' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', analyticsId, {
        page_title: pageName,
        page_location: window.location.href
      })
    }
  }, [])

  return {
    trackEvent,
    trackFileUpload,
    trackFileConversion,
    trackDownload,
    trackError,
    trackPageView
  }
} 