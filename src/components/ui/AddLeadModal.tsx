import React, { useState, useId } from 'react';
import { 
  X, UploadCloud, UserPlus, Webhook, Download, 
  CheckCircle2, AlertCircle, FileText, ArrowRight,
  Sparkles, RefreshCw
} from 'lucide-react';
import { Button } from './Button';
import { useAppContext } from '../../context/AppContext';
import { parseCSVToLeads, calculateLeadScores } from '../../lib/leadScorer';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'csv' | 'manual' | 'webhook';
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  leadSource: 'Instagram',
  placement: 'Reels',
  creativeType: 'Video',
  occupation: 'Working Professional',
  totalVisits: 3,
  timeOnWebsite: 4.5,
  cpc: 1.25,
};

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'csv' 
}) => {
  const { addLead, importLeads, simulateInboundMessage } = useAppContext();
  const [activeTab, setActiveTab] = useState<'csv' | 'manual' | 'webhook'>(initialTab);

  // Manual Form State
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Upload State
  const [dragActive, setDragActive] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const fileInputId = useId();

  // Webhook Simulator State
  const [webhookChannel, setWebhookChannel] = useState<'meta' | 'whatsapp' | 'instagram'>('meta');
  const [simName, setSimName] = useState('Ananya Rao');
  const [simContact, setSimContact] = useState('+91 98450 12345');
  const [simMessage, setSimMessage] = useState('Interested in enterprise package. Please send brochure.');
  const [simSuccess, setSimSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate live score preview for manual form
  const previewLead = calculateLeadScores({
    name: formData.name || 'Sample Prospect',
    leadSource: formData.leadSource,
    placement: formData.placement,
    creativeType: formData.creativeType,
    occupation: formData.occupation,
    totalVisits: formData.totalVisits,
    timeOnWebsite: formData.timeOnWebsite,
    cpc: formData.cpc,
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addLead({
        name: formData.name,
        email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: formData.phone || '+1 (555) 000-0000',
        leadSource: formData.leadSource,
        placement: formData.placement,
        creativeType: formData.creativeType,
        totalVisits: Number(formData.totalVisits),
        timeOnWebsite: Number(formData.timeOnWebsite),
        cpc: Number(formData.cpc),
        lastActivity: 'Manual Entry Created',
      });
      setFormData(initialForm);
      onClose();
    } catch (err) {
      console.error('Error adding lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileProcess = (file: File) => {
    setCsvError(null);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const leads = parseCSVToLeads(text);
        if (leads.length === 0) {
          setCsvError('No valid leads found in CSV file.');
          setParsedPreview([]);
        } else {
          setParsedPreview(leads);
        }
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV file. Please check column format.');
        setParsedPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length > 0) {
      importLeads(parsedPreview);
      setParsedPreview([]);
      setCsvFileName(null);
      onClose();
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSimSuccess(false);

    try {
      if (webhookChannel === 'meta') {
        await addLead({
          name: simName,
          email: `${simName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
          phone: simContact,
          leadSource: 'Facebook',
          leadOrigin: 'Meta Lead Ads Webhook',
          placement: 'Reels',
          creativeType: 'Video',
          totalVisits: 3,
          timeOnWebsite: 5.2,
          lastActivity: 'Meta Lead Ad Form Submitted',
        });
      } else {
        await simulateInboundMessage(
          webhookChannel,
          simName,
          simContact,
          simMessage
        );
      }

      setSimSuccess(true);
      setTimeout(() => {
        setSimSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-input-bg border border-border rounded-lg px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors";
  const labelClasses = "block text-xs font-medium text-text-secondary mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-background-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-background-elevated/40">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Ingest Leads into Priority Queue</h2>
            <p className="text-xs text-text-muted mt-0.5">Choose an ingestion channel to score prospects with calibrated ML</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-hover-bg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border bg-background-secondary px-6">
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-medium transition-all ${
              activeTab === 'csv'
                ? 'border-primary text-primary bg-background-elevated/30'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Dataset (CSV)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-medium transition-all ${
              activeTab === 'manual'
                ? 'border-primary text-primary bg-background-elevated/30'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Manual Lead Entry
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-medium transition-all ${
              activeTab === 'webhook'
                ? 'border-primary text-primary bg-background-elevated/30'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Webhook className="w-4 h-4" />
            Webhook Guide & Simulator
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: CSV Upload */}
          {activeTab === 'csv' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Need a format reference?</div>
                    <div className="text-xs text-text-muted">Use our standardized CSV template with realistic ad-metrics</div>
                  </div>
                </div>
                <a
                  href="/sample_leads_template.csv"
                  download="sample_leads_template.csv"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-elevated border border-border text-xs font-medium text-primary hover:bg-hover-bg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </a>
              </div>

              {/* Drag and drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-background-elevated/30'
                }`}
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                <input
                  id={fileInputId}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {csvFileName ? `Selected: ${csvFileName}` : 'Click to browse or drag & drop CSV'}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Supports columns: full_name, email, phone, lead_source, placement, visits, time_on_site, cpc
                </p>
              </div>

              {/* CSV Error */}
              {csvError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-status-hot/10 border border-status-hot/20 text-status-hot text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {/* Parsed Preview */}
              {parsedPreview.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden bg-background-elevated/20">
                  <div className="p-3 border-b border-border bg-background-elevated/50 flex justify-between items-center text-xs font-medium">
                    <span className="text-text-primary">Ready to Ingest: {parsedPreview.length} Leads</span>
                    <span className="text-text-muted">Calculated using 6-stage ML pipeline</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border">
                    {parsedPreview.map((lead, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-hover-bg/30">
                        <div>
                          <div className="font-semibold text-text-primary">{lead.name}</div>
                          <div className="text-text-muted text-[11px]">{lead.leadSource} • {lead.placement}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            lead.status === 'Hot' ? 'bg-status-hot/15 text-status-hot' :
                            lead.status === 'Warm' ? 'bg-status-warm/15 text-status-warm' :
                            'bg-status-cold/15 text-status-cold'
                          }`}>
                            Score: {lead.currentScore}
                          </span>
                          <span className="text-text-muted text-[11px]">{lead.confidence} Conf.</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-border flex justify-end gap-2 bg-background-card">
                    <Button variant="ghost" size="sm" onClick={() => { setParsedPreview([]); setCsvFileName(null); }}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={handleConfirmImport}>
                      Commit {parsedPreview.length} Leads to Queue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Manual Lead Entry */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Full Name *</label>
                  <input
                    required
                    type="text"
                    className={inputClasses}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Liam Smith"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Email Address</label>
                  <input
                    type="email"
                    className={inputClasses}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="liam.smith@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClasses}>Phone Number</label>
                  <input
                    type="tel"
                    className={inputClasses}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 180-7964"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Lead Source</label>
                  <select
                    className={inputClasses}
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google">Google</option>
                    <option value="Direct Traffic">Direct Traffic</option>
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Placement</label>
                  <select
                    className={inputClasses}
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  >
                    <option value="Reels">Reels</option>
                    <option value="Stories">Stories</option>
                    <option value="Feed">Feed</option>
                    <option value="Audience Network">Audience Network</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClasses}>Occupation</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Total Website Visits</label>
                  <input
                    type="number"
                    min="1"
                    className={inputClasses}
                    value={formData.totalVisits}
                    onChange={(e) => setFormData({ ...formData, totalVisits: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Time on Site (min)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className={inputClasses}
                    value={formData.timeOnWebsite}
                    onChange={(e) => setFormData({ ...formData, timeOnWebsite: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Real-time ML Score Preview Badge */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Instant ML Model Output</div>
                    <div className="text-[11px] text-text-muted">Calculates logit bias, Platt calibration, & Wald interval</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-text-muted">Estimated Score</div>
                    <div className="text-base font-bold text-primary">{previewLead.currentScore}/100</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    previewLead.status === 'Hot' ? 'bg-status-hot/20 text-status-hot' :
                    previewLead.status === 'Warm' ? 'bg-status-warm/20 text-status-warm' :
                    'bg-status-cold/20 text-status-cold'
                  }`}>
                    {previewLead.status}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Scoring & Adding...' : 'Add Lead to Priority Queue'}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: Webhook Ingestion Guide & Simulator */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              
              {/* Endpoint Documentation Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Configured Inbound Endpoints
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-border bg-background-elevated/40">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400">
                      META LEAD ADS
                    </span>
                    <div className="font-mono text-xs font-semibold text-text-primary mt-1.5 break-all">
                      POST /api/webhook/meta
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">
                      Meta Graph API handshake with SHA-256 HMAC verification.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background-elevated/40">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400">
                      WHATSAPP INBOUND
                    </span>
                    <div className="font-mono text-xs font-semibold text-text-primary mt-1.5 break-all">
                      POST /api/webhook/whatsapp
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">
                      Inbound messages auto-create leads and trigger conversations.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-background-elevated/40">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400">
                      INSTAGRAM DM
                    </span>
                    <div className="font-mono text-xs font-semibold text-text-primary mt-1.5 break-all">
                      POST /api/webhook/instagram
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">
                      Direct Messages link IG scoped IDs into the unified queue.
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook Simulator Form */}
              <div className="p-4 rounded-xl border border-border bg-background-elevated/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-text-primary">
                      Interactive Webhook Simulator
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">Simulate live incoming payload</span>
                </div>

                <form onSubmit={handleSimulateWebhook} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClasses}>Trigger Channel</label>
                      <select
                        className={inputClasses}
                        value={webhookChannel}
                        onChange={(e: any) => setWebhookChannel(e.target.value)}
                      >
                        <option value="meta">Meta Lead Ads Form</option>
                        <option value="whatsapp">WhatsApp Inbound Message</option>
                        <option value="instagram">Instagram Direct Message</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClasses}>Prospect Name</label>
                      <input
                        required
                        type="text"
                        className={inputClasses}
                        value={simName}
                        onChange={(e) => setSimName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClasses}>
                        {webhookChannel === 'instagram' ? 'Instagram Handle' : 'Phone Number'}
                      </label>
                      <input
                        required
                        type="text"
                        className={inputClasses}
                        value={simContact}
                        onChange={(e) => setSimContact(e.target.value)}
                      />
                    </div>
                  </div>

                  {webhookChannel !== 'meta' && (
                    <div>
                      <label className={labelClasses}>Inbound Message Body</label>
                      <input
                        type="text"
                        className={inputClasses}
                        value={simMessage}
                        onChange={(e) => setSimMessage(e.target.value)}
                      />
                    </div>
                  )}

                  {simSuccess && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Webhook simulated successfully! Scored lead added to Priority Queue.</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={isSubmitting}>
                      <ArrowRight className="w-4 h-4 mr-1.5" />
                      {isSubmitting ? 'Simulating Webhook...' : 'Fire Test Webhook'}
                    </Button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
