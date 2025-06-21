import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
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
  const fileInputRef = useRef(null)

  const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    
    // Validate file sizes
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} is too large. Maximum size is 1GB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      setError('No valid files selected.')
      return
    }

    setFiles(validFiles)
    setError(null)
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
    } catch (error) {
      setError(`Error processing files: ${error.message}`)
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
    } else {
      // Download multiple files
      Object.entries(convertedData).forEach(([sheetName, data]) => {
        const sheetJsonString = JSON.stringify(data, null, 2)
        const sheetBlob = new Blob([sheetJsonString], { type: 'application/json' })
        saveAs(sheetBlob, `${sheetName}.json`)
      })
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
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Excel to JSON Converter</h1>
        <p>Convert Excel and CSV files to JSON format in your browser</p>
      </header>

      <main className="app-main">
        {/* File Upload Section */}
        <section className="upload-section">
          <h2>Upload Files</h2>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="file-input"
            />
            <div className="upload-info">
              <p>Supported formats: .xlsx, .xls, .csv</p>
              <p>Maximum file size: 1GB per file</p>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="file-list">
              <h3>Selected Files ({files.length})</h3>
              <ul>
                {files.map((file, index) => (
                  <li key={index}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Settings Section */}
        <section className="settings-section">
          <h2>Conversion Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label htmlFor="outputFormat">Output Format:</label>
              <select
                id="outputFormat"
                value={settings.outputFormat}
                onChange={(e) => setSettings({...settings, outputFormat: e.target.value})}
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
                  onChange={(e) => setSettings({...settings, includeHeaders: e.target.checked})}
                />
                Include headers as property names
              </label>
            </div>
          </div>
        </section>

        {/* Convert Button */}
        <section className="convert-section">
          <button
            onClick={convertFiles}
            disabled={files.length === 0 || isProcessing}
            className="convert-btn"
          >
            {isProcessing ? 'Converting...' : 'Convert to JSON'}
          </button>
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
            <h2>Preview</h2>
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
                Download JSON
              </button>
              <button onClick={clearAll} className="clear-btn">
                Clear All
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
