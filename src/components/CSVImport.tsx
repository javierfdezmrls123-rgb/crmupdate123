import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CSVImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedLead {
  name: string;
  company: string;
  revenue: string;
  website: string;
  phone: string;
  ceo: string;
  go_skip: string;
  whose_phone: string;
  called: string;
  last_contact: string;
  notes: string;
  status: string;
}

const CSVImport: React.FC<CSVImportProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    imported: number;
    duplicates: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const parseCSV = (csvText: string): ParsedLead[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const leads: ParsedLead[] = [];
    
    // Skip header row, start from index 1
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV with proper quote handling
      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim());
      
      // Map columns: Firm, Revenue, Website, GO/SKIP, Phone N., Whose Phone, CEO, Called, Last contact, Notes, Status
      if (columns.length >= 11) {
        const lead: ParsedLead = {
          company: columns[0] || '',
          revenue: columns[1] || '',
          website: columns[2] || '',
          go_skip: columns[3] || '',
          phone: columns[4] || '',
          whose_phone: columns[5] || '',
          ceo: columns[6] || '',
          called: columns[7] || '',
          last_contact: columns[8] || '',
          notes: columns[9] || '',
          status: columns[10] || '',
          name: columns[6] || 'Unknown' // Use CEO as name only
        };
        
        // Skip if explicitly marked as skip
        if (lead.go_skip.toLowerCase().includes('skip')) {
          continue;
        }
        
        // Skip if no company name
        if (!lead.company.trim()) {
          continue;
        }
        
        // Skip if no actual contact person (CEO field is empty)
        if (!lead.ceo.trim()) {
          continue;
        }
        
        leads.push(lead);
      }
    }
    
    return leads;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;
    
    setImporting(true);
    const errors: string[] = [];
    let imported = 0;
    let duplicates = 0;
    let skipped = 0;
    
    try {
      const csvText = await file.text();
      const parsedLeads = parseCSV(csvText);
      
      console.log(`📊 Parsed ${parsedLeads.length} leads from CSV`);
      
      // Get existing companies to check for duplicates
      const { data: existingLeads, error: fetchError } = await supabase
        .from('leads')
        .select('company');
      
      if (fetchError) throw fetchError;
      
      const existingCompanies = new Set(
        existingLeads?.map(lead => lead.company.toLowerCase().trim()) || []
      );
      
      // Process leads in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < parsedLeads.length; i += batchSize) {
        const batch = parsedLeads.slice(i, i + batchSize);
        const leadsToInsert = [];
        
        for (const lead of batch) {
          const companyKey = lead.company.toLowerCase().trim();
          
          if (existingCompanies.has(companyKey)) {
            duplicates++;
            continue;
          }
          
          // Prepare lead data for database
          const leadData = {
            user_id: user.id,
            name: lead.name || lead.ceo || 'Unknown',
            company: lead.company.trim(),
            phone: lead.phone || '',
            position: '',
            status: (() => {
              const rawStatus = lead.status?.toLowerCase().trim() || 'prospect';
              // Map common status variations to valid database values
              const statusMap: { [key: string]: string } = {
                'prospect': 'prospect',
                'qualified': 'qualified',
                'proposal': 'proposal',
                'negotiation': 'negotiation',
                'closed won': 'closed-won',
                'closed-won': 'closed-won',
                'closed lost': 'closed-lost',
                'closed-lost': 'closed-lost',
                'won': 'closed-won',
                'lost': 'closed-lost'
              };
              return statusMap[rawStatus] || 'prospect';
            })() as const,
            revenue: lead.revenue || '',
            notes: lead.notes || '',
            call_status: 'not_called' as const,
            industry: 'HENKILÖSTÖVUOKRAUS', // Default industry
            website: lead.website || '',
            ceo: lead.ceo || '',
            whose_phone: lead.whose_phone || '',
            go_skip: lead.go_skip || '',
            last_contact: new Date().toISOString(), // Set to current time for timer calculation
            scheduled_call: null // No scheduled call for imported leads by default
          };
          
          leadsToInsert.push(leadData);
          existingCompanies.add(companyKey); // Add to set to prevent duplicates within the same import
        }
        
        // Insert batch
        if (leadsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadsToInsert);
          
          if (insertError) {
            console.error('Batch insert error:', insertError);
            errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
            skipped += leadsToInsert.length;
          } else {
            imported += leadsToInsert.length;
            console.log(`✅ Imported batch of ${leadsToInsert.length} leads`);
          }
        }
      }
      
      setResults({
        total: parsedLeads.length,
        imported,
        duplicates,
        skipped,
        errors
      });
      
      if (imported > 0) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Import error:', error);
      errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults({
        total: 0,
        imported: 0,
        duplicates: 0,
        skipped: 0,
        errors
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Firm,Revenue,Website,GO/SKIP,Phone N.,Whose Phone,CEO,Called,Last contact,Notes,Status
Example Company,1000000,https://example.com,,+358401234567,Contact Person,John Doe,Yes,2024-01-15,Initial contact made,prospect
Another Company,500000,https://another.com,Skip,+358407654321,Secretary,Jane Smith,No,2024-01-10,Follow up needed,qualified`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 data-grid"></div>
      <div className="relative tech-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden glow-green">
        <div className="flex items-center justify-between p-6 border-b border-green-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-900 bg-opacity-30 rounded-lg flex items-center justify-center glow-green">
              <Upload className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-300">Import Leads from CSV</h2>
              <p className="text-sm text-green-400">Upload your CSV file to import leads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* CSV Format Info */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Expected CSV Format:</h3>
            <p className="text-xs text-blue-400 mb-2">
              Firm, Revenue, Website, GO/SKIP, Phone N., Whose Phone, CEO, Called, Last contact, Notes, Status
            </p>
            <button
              onClick={downloadTemplate}
              className="text-xs text-blue-300 hover:text-blue-200 underline flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Download Template</span>
            </button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-900 file:text-green-300 hover:file:bg-green-800"
              />
            </div>

            {file && (
              <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">{file.name}</span>
                  <span className="text-xs text-green-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
            )}
          </div>

          {/* Import Results */}
          {results && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-green-300">Import Results</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-400">Total</p>
                  <p className="text-lg font-bold text-blue-300">{results.total}</p>
                </div>
                <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-400">Imported</p>
                  <p className="text-lg font-bold text-green-300">{results.imported}</p>
                </div>
                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-400">Duplicates</p>
                  <p className="text-lg font-bold text-yellow-300">{results.duplicates}</p>
                </div>
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-400">Skipped</p>
                  <p className="text-lg font-bold text-red-300">{results.skipped}</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-300 mb-2">Errors:</h4>
                  <ul className="text-xs text-red-400 space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.imported > 0 && (
                <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300">
                      Successfully imported {results.imported} leads!
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 tech-border text-green-300 rounded-lg hover:bg-green-800 hover:bg-opacity-30 transition-colors"
            >
              {results ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 tech-button text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Import Leads</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImport;