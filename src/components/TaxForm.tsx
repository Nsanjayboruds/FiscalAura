"use client";

import { useState } from 'react';
import OCRUploader from './ocr/OCRUploder';

interface ExtractedData {
  pan: string;
  name: string;
  income: number;
  tds: number;
  deductions: {
    section80C: number;
    section80D: number;
    hra: number;
  };
  confidenceScore: number;
  rawText: string;
}

export default function TaxForm() {
  const [formData, setFormData] = useState({
    pan: '',
    name: '',
    income: '',
    tds: '',
    section80C: '',
    section80D: '',
    hra: ''
  });
  const [confidence, setConfidence] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExtracted = (data: ExtractedData) => {
    setFormData({
      pan: data.pan || '',
      name: data.name || '',
      income: data.income?.toString() || '',
      tds: data.tds?.toString() || '',
      section80C: data.deductions?.section80C?.toString() || '',
      section80D: data.deductions?.section80D?.toString() || '',
      hra: data.deductions?.hra?.toString() || ''
    });
    setConfidence(data.confidenceScore);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tax Data:', formData);
    alert('Tax data saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tax Filing Assistant</h1>
      
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">✅ Data extracted and auto-filled! Please verify.</p>
          {confidence && (
            <p className="text-sm text-green-500">Confidence: {confidence}%</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OCRUploader onExtracted={handleExtracted} />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Tax Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="ABCDE1234F"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Full Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Income (₹)</label>
                <input
                  type="number"
                  value={formData.income}
                  onChange={(e) => setFormData({...formData, income: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter total income"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TDS Deducted (₹)</label>
                <input
                  type="number"
                  value={formData.tds}
                  onChange={(e) => setFormData({...formData, tds: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter TDS amount"
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Deductions</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Section 80C (₹)</label>
                    <input
                      type="number"
                      value={formData.section80C}
                      onChange={(e) => setFormData({...formData, section80C: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="PPF, ELSS, LIC, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Section 80D (₹)</label>
                    <input
                      type="number"
                      value={formData.section80D}
                      onChange={(e) => setFormData({...formData, section80D: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Health Insurance"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">HRA (₹)</label>
                    <input
                      type="number"
                      value={formData.hra}
                      onChange={(e) => setFormData({...formData, hra: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="House Rent Allowance"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full mt-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Save Tax Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}