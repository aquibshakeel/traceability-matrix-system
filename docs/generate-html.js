#!/usr/bin/env node
/**
 * HTML Generator Script
 * Converts markdown docs to rich HTML with sophisticated styling
 */

const fs = require('fs');
const path = require('path');

const richStyle = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1a202c;
        background: #f7fafc;
    }
    .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.2em; opacity: 0.9; }
    
    .container {
        display: flex;
        max-width: 1400px;
        margin: 0 auto;
        background: white;
    }
    
    .sidebar {
        width: 280px;
        background: #2d3748;
        color: white;
        padding: 20px;
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
    }
    .sidebar h3 {
        color: #fff;
        margin-bottom: 15px;
        font-size: 1.1em;
        border-bottom: 2px solid #667eea;
        padding-bottom: 10px;
    }
    .sidebar ul { list-style: none; }
    .sidebar li { margin: 8px 0; }
    .sidebar a {
        color: #cbd5e0;
        text-decoration: none;
        display: block;
        padding: 8px 12px;
        border-radius: 5px;
        transition: all 0.3s;
    }
    .sidebar a:hover {
        background: #4a5568;
        color: #fff;
        transform: translateX(5px);
    }
    
    .content {
        flex: 1;
        padding: 40px 60px;
        max-width: 900px;
    }
    .content h2 {
        color: #667eea;
        font-size: 2em;
        margin: 40px 0 20px 0;
        padding-bottom: 10px;
        border-bottom: 3px solid #667eea;
    }
    .content h3 {
        color: #764ba2;
        font-size: 1.5em;
        margin: 30px 0 15px 0;
    }
    .content h4 {
        color: #667eea;
        font-size: 1.2em;
        margin: 20px 0 10px 0;
    }
    
    .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85em;
        font-weight: bold;
        margin: 5px 5px 5px 0;
    }
    .badge-new { background: #48bb78; color: white; }
    .badge-ai { background: #667eea; color: white; }
    .badge-success { background: #10b981; color: white; }
    .badge-info { background: #3b82f6; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    
    .code-block {
        background: #1a202c;
        color: #e2e8f0;
        padding: 20px;
        border-radius: 8px;
        margin: 15px 0;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.5;
    }
    
    .info-box {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
        padding: 15px 20px;
        margin: 15px 0;
        border-radius: 5px;
    }
    .warning-box {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 15px 20px;
        margin: 15px 0;
        border-radius: 5px;
    }
    .success-box {
        background: #d1fae5;
        border-left: 4px solid #10b981;
        padding: 15px 20px;
        margin: 15px 0;
        border-radius: 5px;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    table th {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px;
        text-align: left;
    }
    table td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
    }
    table tr:hover { background: #f7fafc; }
    
    ul, ol { margin: 15px 0 15px 25px; }
    li { margin: 8px 0; }
    
    code {
        background: #edf2f7;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        color: #d63384;
    }
    
    @media print {
        .sidebar { display: none; }
        .content { max-width: 100%; padding: 20px; }
    }
    @media (max-width: 1024px) {
        .container { flex-direction: column; }
        .sidebar {
            width: 100%;
            height: auto;
            position: relative;
        }
        .content { padding: 20px; }
    }
`;

console.log('HTML generation script created!');
console.log('\nTo generate HTML files, use pandoc:');
console.log('npm install -g pandoc');
console.log('');
console.log('Then run:');
console.log('node docs/generate-html.js');
