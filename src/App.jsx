/**
 * Excel to JSON Converter
 * 
 * Copyright (c) 2024 Emp0. All rights reserved.
 * 
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://mariadb.com/bsl11/
 * 
 * This license is permanent and will not change to Apache 2.0.
 */

import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import excelLogo from '/excel.svg'
import emp0Logo from '/emp0.png'
import { useAnalytics } from './hooks/useAnalytics'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [convertedData, setConvertedData] = useState(null)
  const [settings, setSettings] = useState({
    outputFormat: 'single', // 'single' or 'multiple'
    includeHeaders: true,
    flattenNested: false
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const { trackFileUpload, trackFileConversion, trackDownload, trackError, trackPageView, trackEvent } = useAnalytics()

  const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

  // Track page view on component mount
  useEffect(() => {
    trackPageView('Excel to JSON Converter')
  }, [trackPageView])

  // Debug files state changes
  useEffect(() => {
    console.log('Files state changed:', files.length, 'files')
    files.forEach((file, index) => {
      console.log(`File ${index}:`, file.name, file.size)
    })
  }, [files])

  const validateAndSetFiles = (selectedFiles) => {
    console.log('Validating files:', selectedFiles.length)
    
    const validFiles = selectedFiles.filter(file => {
      console.log('Checking file:', file.name, 'size:', file.size, 'max:', MAX_FILE_SIZE)
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `File ${file.name} is too large. Maximum size is 1GB.`
        console.log('File too large:', errorMsg)
        setError(errorMsg)
        trackError('file_too_large', errorMsg)
        return false
      }
      return true
    })

    console.log('Valid files after filtering:', validFiles.length)

    if (validFiles.length === 0) {
      const errorMsg = 'No valid files selected.'
      console.log('No valid files:', errorMsg)
      setError(errorMsg)
      trackError('no_valid_files', errorMsg)
      return
    }

    // Track file uploads
    validFiles.forEach(file => {
      const fileType = file.name.toLowerCase().split('.').pop()
      trackFileUpload(fileType, file.size)
    })

    console.log('Setting files state with:', validFiles.length, 'files')
    setFiles(prevFiles => [...prevFiles, ...validFiles])
    setError(null)
  }

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    validateAndSetFiles(selectedFiles);
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(event.dataTransfer.files)
    console.log('Dropped files:', droppedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })))
    validateAndSetFiles(droppedFiles)
  }

  const handleUploadAreaClick = (event) => {
    // Only trigger if the click is NOT on the file input itself
    if (event.target === event.currentTarget) {
      fileInputRef.current?.click();
    }
  }

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
    // Clear converted data when files are removed
    if (files.length === 1) {
      setConvertedData(null)
    }
  }

  const processExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          const result = {}
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: settings.includeHeaders ? 1 : undefined 
            })
            result[sheetName] = jsonData
          })
          
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const processCSVFile = async (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: settings.includeHeaders,
        complete: (results) => {
          resolve({ [file.name.replace(/\.[^/.]+$/, '')]: results.data })
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  const convertFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one file.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const allData = {}
      
      for (const file of files) {
        let fileData
        const fileExtension = file.name.toLowerCase().split('.').pop()
        
        if (fileExtension === 'csv') {
          fileData = await processCSVFile(file)
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
          fileData = await processExcelFile(file)
        } else {
          throw new Error(`Unsupported file type: ${fileExtension}`)
        }
        
        Object.assign(allData, fileData)
      }

      setConvertedData(allData)
      trackFileConversion(files.length, settings.outputFormat)
    } catch (error) {
      setError(`Error processing files: ${error.message}`)
      trackError('processing_error', error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadJSON = () => {
    if (!convertedData) return

    const jsonString = JSON.stringify(convertedData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    if (settings.outputFormat === 'single') {
      saveAs(blob, 'converted_data.json')
      trackDownload(settings.outputFormat, 1)
    } else {
      // Download multiple files
      const fileCount = Object.keys(convertedData).length
      Object.entries(convertedData).forEach(([sheetName, data]) => {
        const sheetJsonString = JSON.stringify(data, null, 2)
        const sheetBlob = new Blob([sheetJsonString], { type: 'application/json' })
        saveAs(sheetBlob, `${sheetName}.json`)
      })
      trackDownload(settings.outputFormat, fileCount)
    }
  }

  const getPreviewData = () => {
    if (!convertedData) return null

    const preview = {}
    Object.entries(convertedData).forEach(([sheetName, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        const first5 = data.slice(0, 5)
        const last5 = data.slice(-5)
        preview[sheetName] = { first5, last5, totalRows: data.length }
      } else {
        preview[sheetName] = { first5: [], last5: [], totalRows: 0 }
      }
    })
    return preview
  }

  const clearAll = () => {
    setFiles([])
    setConvertedData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    trackEvent('clear_all', 'User Action', 'clear_all')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <img src={excelLogo} alt="Excel Logo" className="excel-logo" />
          <div className="header-text">
            <h1>Excel to JSON Converter</h1>
            <p>Convert Excel (.xlsx, .xls) and CSV files to JSON format instantly. Free online converter for large files up to 1GB.</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* SEO Content Section */}
        <section className="seo-content" style={{display: 'none'}}>
          <h2>Excel to JSON Converter - Free Online Tool</h2>
          <p>Convert Excel files (.xlsx, .xls) and CSV files to JSON format with our free online converter. This powerful tool can handle large files up to 1GB and works entirely in your browser. No registration required, no data sent to servers - your files stay private.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li><strong>Excel to JSON:</strong> Convert .xlsx and .xls files to JSON format</li>
            <li><strong>CSV to JSON:</strong> Convert CSV files to JSON format</li>
            <li><strong>Large File Support:</strong> Handle files up to 1GB in size</li>
            <li><strong>Multiple Files:</strong> Upload and convert multiple files at once</li>
            <li><strong>Drag & Drop:</strong> Easy file upload with drag and drop interface</li>
            <li><strong>Privacy First:</strong> All processing happens in your browser</li>
            <li><strong>No Registration:</strong> Use immediately without signing up</li>
          </ul>
          
          <h3>How to Convert Excel to JSON:</h3>
          <ol>
            <li>Upload your Excel (.xlsx, .xls) or CSV file using the upload area</li>
            <li>Choose your preferred output format (single JSON file or multiple files)</li>
            <li>Click "Convert to JSON" to process your files</li>
            <li>Preview the converted data and download your JSON files</li>
          </ol>
          
          <h3>Supported File Formats:</h3>
          <ul>
            <li><strong>Excel Files:</strong> .xlsx, .xls</li>
            <li><strong>CSV Files:</strong> .csv</li>
            <li><strong>Output Format:</strong> JSON (.json)</li>
          </ul>
        </section>

        {/* File Upload Section */}
        <section className="upload-section">
          <h2>Upload Excel & CSV Files</h2>
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadAreaClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="file-input"
              key="file-input"
            />
            <div className="upload-info">
              <img src={excelLogo} alt="Excel" className="upload-excel-icon" />
              <p><strong>Click to browse</strong> or drag and drop Excel (.xlsx, .xls) and CSV files here</p>
              <p>Supported formats: .xlsx, .xls, .csv</p>
              <p>Maximum file size: 1GB per file</p>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="file-list">
              <div className="file-list-header">
                <h3>Selected Files ({files.length})</h3>
                <button onClick={clearAll} className="clear-all-btn">
                  Clear All
                </button>
              </div>
              <ul>
                {files.map((file, index) => (
                  <li key={index}>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button 
                      onClick={() => removeFile(index)} 
                      className="remove-file-btn"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Settings Section */}
        <section className="settings-section">
          <h2>JSON Conversion Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label htmlFor="outputFormat">Output Format:</label>
              <select
                id="outputFormat"
                value={settings.outputFormat}
                onChange={(e) => {
                  setSettings({...settings, outputFormat: e.target.value})
                  trackEvent('setting_change', 'Settings', 'output_format', null)
                }}
              >
                <option value="single">Single JSON file</option>
                <option value="multiple">Multiple JSON files (one per sheet)</option>
              </select>
            </div>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.includeHeaders}
                  onChange={(e) => {
                    setSettings({...settings, includeHeaders: e.target.checked})
                    trackEvent('setting_change', 'Settings', 'include_headers', null)
                  }}
                />
                Include headers as property names
              </label>
            </div>
          </div>
          
          <div className="convert-section">
            <button
              onClick={convertFiles}
              disabled={files.length === 0 || isProcessing}
              className="convert-btn"
            >
              {isProcessing ? 'Converting Excel to JSON...' : 'Convert Excel to JSON'}
            </button>
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Preview Section */}
        {convertedData && (
          <section className="preview-section">
            <h2>JSON Preview</h2>
            <div className="preview-container">
              {Object.entries(getPreviewData()).map(([sheetName, preview]) => (
                <div key={sheetName} className="sheet-preview">
                  <h3>{sheetName} ({preview.totalRows} rows)</h3>
                  
                  {preview.first5.length > 0 && (
                    <div className="preview-section">
                      <h4>First 5 items:</h4>
                      <pre>{JSON.stringify(preview.first5, null, 2)}</pre>
                    </div>
                  )}
                  
                  {preview.last5.length > 0 && preview.totalRows > 5 && (
                    <div className="preview-section">
                      <h4>Last 5 items:</h4>
                      <pre>{JSON.stringify(preview.last5, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="download-section">
              <button onClick={downloadJSON} className="download-btn">
                Download JSON Files
              </button>
              <button onClick={clearAll} className="clear-btn">
                Clear All
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <a href="https://emp0.com" target="_blank" rel="noopener noreferrer" className="footer-link-card">
              <img src={emp0Logo} alt="Emp0" className="emp0-logo" />
              <div className="footer-link-content">
                <span className="footer-link-title">Discover other free tools</span>
                <span className="footer-link-desc">emp0.com</span>
              </div>
            </a>
          </div>
          
          <div className="footer-section">
            <a href="mailto:tools@emp0.com" className="footer-link-card">
              <svg className="email-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <div className="footer-link-content">
                <span className="footer-link-title">Send feature request</span>
                <span className="footer-link-desc">tools@emp0.com</span>
              </div>
            </a>
          </div>
          
          <div className="footer-section">
            <a href="https://discord.com/users/jym.god" target="_blank" rel="noopener noreferrer" className="footer-link-card">
              <svg className="discord-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
              </svg>
              <div className="footer-link-content">
                <span className="footer-link-title">Get support on Discord</span>
                <span className="footer-link-desc">@jym.god</span>
              </div>
            </a>
          </div>
          
          <div className="footer-section">
            <a href="https://github.com/Jharilela/excel-to-json-converter" target="_blank" rel="noopener noreferrer" className="footer-link-card">
              <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <div className="footer-link-content">
                <span className="footer-link-title">View source code</span>
                <span className="footer-link-desc">GitHub repository</span>
              </div>
        </a>
      </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Emp0. All rights reserved.</p>
        </div>
      </footer>
      </div>
  )
}

export default App
