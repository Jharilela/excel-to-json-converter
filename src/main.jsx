/**
 * Excel to JSON Converter - Main Entry Point
 * 
 * Copyright (c) 2024 Emp0. All rights reserved.
 * 
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://mariadb.com/bsl11/
 * 
 * This license is permanent and will not change to Apache 2.0.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
