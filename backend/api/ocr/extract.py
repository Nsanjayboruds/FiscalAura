from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

def extract_pan(text):
    pattern = r'[A-Z]{5}[0-9]{4}[A-Z]{1}'
    match = re.search(pattern, text)
    return match.group(0) if match else None

def extract_name(text):
    lines = text.split('\n')
    for line in lines[:20]:
        if 'Name' in line or 'PAN' in line or 'Taxpayer' in line:
            parts = re.split(r'[:\-]', line)
            if len(parts) > 1:
                name = parts[1].strip()
                if len(name) > 3:
                    return name[:100]
    return None

def extract_income(text):
    patterns = [
        r'Total Income\s*:?\s*₹?\s*([\d,]+)',
        r'Gross Total Income\s*:?\s*₹?\s*([\d,]+)',
        r'Income\s*:?\s*₹?\s*([\d,]+)',
        r'Total\s*Income\s*([\d,]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1).replace(',', ''))
    return None

def extract_tds(text):
    patterns = [
        r'TDS\s*:?\s*₹?\s*([\d,]+)',
        r'Tax Deducted at Source\s*:?\s*₹?\s*([\d,]+)',
        r'TDS Deducted\s*:?\s*₹?\s*([\d,]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1).replace(',', ''))
    return None

def extract_deductions(text):
    deductions = {
        'section80C': 0,
        'section80D': 0,
        'hra': 0
    }
    
    # Extract 80C deductions
    patterns_80c = [
        r'80C[:\s]*₹?\s*([\d,]+)',
        r'Sec 80C[:\s]*₹?\s*([\d,]+)',
        r'Section 80C[:\s]*₹?\s*([\d,]+)'
    ]
    for pattern in patterns_80c:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            deductions['section80C'] = int(match.group(1).replace(',', ''))
            break
    
    # Extract 80D deductions
    patterns_80d = [
        r'80D[:\s]*₹?\s*([\d,]+)',
        r'Sec 80D[:\s]*₹?\s*([\d,]+)'
    ]
    for pattern in patterns_80d:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            deductions['section80D'] = int(match.group(1).replace(',', ''))
            break
    
    # Extract HRA
    patterns_hra = [
        r'HRA[:\s]*₹?\s*([\d,]+)',
        r'House Rent Allowance[:\s]*₹?\s*([\d,]+)'
    ]
    for pattern in patterns_hra:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            deductions['hra'] = int(match.group(1).replace(',', ''))
            break
    
    return deductions

@app.route('/api/ocr/extract', methods=['POST'])
def extract():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Try to extract text from the file
    text = ''
    try:
        # For demo purposes, try to read as text
        text = file.read().decode('utf-8', errors='ignore')
    except:
        text = "Sample text for testing. PAN: ABCDE1234F, Name: Rajesh Kumar, Income: 850000, TDS: 45000"
    
    # If text is empty or too short, use mock data for demo
    if len(text) < 50:
        # For demonstration purposes - In production, use actual OCR
        text = """
        Form 16 - Tax Deducted at Source
        PAN: ABCDE1234F
        Name: Rajesh Kumar
        Total Income: ₹8,50,000
        TDS Deducted: ₹45,000
        Section 80C: ₹1,50,000
        Section 80D: ₹25,000
        HRA: ₹1,20,000
        """
    
    # Extract data
    extracted_data = {
        'pan': extract_pan(text),
        'name': extract_name(text),
        'income': extract_income(text),
        'tds': extract_tds(text),
        'deductions': extract_deductions(text),
        'rawText': text[:2000],
        'confidenceScore': 85  # Default confidence score
    }
    
    return jsonify(extracted_data)

if __name__ == '__main__':
    app.run(port=5001, debug=True)