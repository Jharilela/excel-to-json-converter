# Excel to JSON Converter

A modern, browser-based application for converting Excel and CSV files to JSON format. Built with React and Vite, this application processes files entirely in the browser without sending any data to external servers.

## Features

- **File Upload**: Support for multiple file formats (.xlsx, .xls, .csv)
- **Large File Support**: Handle files up to 1GB in size
- **Multiple Files**: Upload and process multiple files simultaneously
- **Conversion Settings**: 
  - Choose between single JSON file or multiple files (one per sheet)
  - Option to include/exclude headers as property names
- **Preview**: View first and last 5 items of converted data before downloading
- **Download**: Download converted JSON files directly to your device
- **Privacy**: All processing happens in your browser - no data is sent to servers

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd excel-to-json-converter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload Files**: Click the upload area or drag and drop your Excel/CSV files
2. **Configure Settings**: Choose your preferred output format and options
3. **Convert**: Click "Convert to JSON" to process your files
4. **Preview**: Review the first and last 5 items of your converted data
5. **Download**: Click "Download JSON" to save the converted files

## Supported File Formats

- **Excel Files**: .xlsx, .xls
- **CSV Files**: .csv
- **Maximum File Size**: 1GB per file

## Output Options

- **Single JSON File**: All sheets combined into one JSON file
- **Multiple JSON Files**: Each sheet saved as a separate JSON file

## Technologies Used

- **React 19**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **SheetJS (xlsx)**: Excel file processing library
- **PapaParse**: CSV parsing library
- **FileSaver.js**: Client-side file downloading

## Browser Compatibility

This application works in all modern browsers that support:
- ES6+ features
- File API
- Blob API
- FileReader API

## Privacy & Security

- All file processing happens locally in your browser
- No data is transmitted to external servers
- Files are not stored on any server
- Your data remains completely private

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
