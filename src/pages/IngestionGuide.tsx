import React, { useState } from 'react';
import { 
  UploadCloud, Webhook, MessageSquare, UserPlus, 
  Download, Cpu, Copy, Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AddLeadModal } from '../components/ui/AddLeadModal';

export const IngestionGuide: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'csv' | 'manual' | 'webhook'>('csv');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const openModal = (tab: 'csv' | 'manual' | 'webhook') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const metaWebhookSnippet = `curl -X POST "http://localhost:8000/api/webhook/meta" \\
  -H "Content-Type: application/json" \\
  -H "X-Hub-Signature-256: sha256=your_hmac_hash" \\
  -d '{
    "entry": [{
      "changes": [{
        "field": "leadgen",
        "value": {
          "leadgen_id": "987654321",
          "form_id": "form_reels_prospects",
          "field_data": [
            {"name": "full_name", "values": ["Aarav Sharma"]},
            {"name": "email", "values": ["aarav@example.com"]},
            {"name": "phone_number", "values": ["+91 98765 43210"]}
          ]
        }
      }]
    }]
  }'`;

  const whatsappWebhookSnippet = `curl -X POST "http://localhost:8000/api/webhook/whatsapp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "contacts": [{"profile": {"name": "Priya Patel"}, "wa_id": "919812345678"}],
          "messages": [{"from": "919812345678", "type": "text", "text": {"body": "Hi, interested in pricing."}}]
        }
      }]
    }]
  }'`;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/15 via-background-card to-background-card border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            MetaLeadIQ Architecture & Ingestion Specification
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            How Leads are Ingested, Scored & Dispatched
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            MetaLeadIQ eliminates static hardcoded lists. Prospect data flows in through 4 production-ready ingestion pipelines, passes through real-time ML calibration and exponential half-life decay, and populates the operator priority queue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button onClick={() => openModal('csv')}>
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload CSV
          </Button>
          <Button variant="outline" onClick={() => openModal('webhook')}>
            <Webhook className="w-4 h-4 mr-1.5" />
            Test Simulator
          </Button>
        </div>
      </div>

      {/* 4 Ingestion Pathways Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pathway 1 */}
        <div className="p-5 rounded-xl border border-border bg-background-card flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Webhook className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">1. Meta Lead Ads Webhook</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Listens at <code className="text-blue-400 font-mono">POST /api/webhook/meta</code>. When a prospect submits an Instant Form on Instagram Reels or Facebook Feed, Meta dispatches a signed webhook.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-[11px] font-semibold text-blue-400">Handshake: hub.challenge verified</span>
          </div>
        </div>

        {/* Pathway 2 */}
        <div className="p-5 rounded-xl border border-border bg-background-card flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">2. WhatsApp Cloud API</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Inbound messages at <code className="text-green-400 font-mono">POST /api/webhook/whatsapp</code> extract the sender phone number and message, creating a lead and opening a thread in the Unified Inbox.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-[11px] font-semibold text-green-400">Two-Way Live Messaging</span>
          </div>
        </div>

        {/* Pathway 3 */}
        <div className="p-5 rounded-xl border border-border bg-background-card flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">3. Campaign CSV Upload</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Drop any CSV dataset from your CRM or ad platform. The built-in client-side and backend parsers extract features, compute Platt probabilities, and score all leads instantly.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <a 
              href="/sample_leads_template.csv" 
              download="sample_leads_template.csv"
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Download Sample CSV
            </a>
          </div>
        </div>

        {/* Pathway 4 */}
        <div className="p-5 rounded-xl border border-border bg-background-card flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">4. Manual Operator Entry</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Sales reps can enter walk-in or offline prospects via the modal. Real-time inference dynamically estimates conversion probability and margin of error before submission.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-[11px] font-semibold text-purple-400">Live Formula Estimation</span>
          </div>
        </div>

      </div>

      {/* 6-Stage Mathematical Pipeline Deep Dive */}
      <div className="p-6 md:p-8 rounded-2xl border border-border bg-background-card space-y-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            The 6-Stage Real-Time Mathematical Pipeline
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Every lead—whether ingested from a webhook or a CSV file—undergoes this strict mathematical progression:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-xl border border-border bg-background-elevated/30 space-y-2">
            <span className="text-xs font-bold text-primary">Stage 1 & 2: Normalization & ML Inference</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Categorical attributes (<code className="text-xs font-mono">ad_placement</code>, <code className="text-xs font-mono">lead_source</code>, <code className="text-xs font-mono">creative_type</code>) are encoded and fed to an XGBoost gradient-boosted decision tree calibrated with Platt scaling:
            </p>
            <div className="p-2.5 rounded bg-background-primary font-mono text-[11px] text-text-primary">
              p(y=1|x) = 1 / (1 + e^-(w·x + b))
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background-elevated/30 space-y-2">
            <span className="text-xs font-bold text-primary">Stage 3 & 4: Wald Confidence Intervals</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Calculates statistical margin of error based on sample size (website visits):
            </p>
            <div className="p-2.5 rounded bg-background-primary font-mono text-[11px] text-text-primary">
              CI = p̂ ± 1.96 · √(p̂(1 - p̂) / n)
            </div>
            <p className="text-[11px] text-text-muted">
              Leads with MoE &lt; 10% receive High confidence; &lt; 20% Moderate; otherwise Uncertain.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background-elevated/30 space-y-2">
            <span className="text-xs font-bold text-primary">Stage 5 & 6: Exponential Decay & Priority</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Decay follows half-life kinetics (λ = ln2 / 24h = 0.02888/hr):
            </p>
            <div className="p-2.5 rounded bg-background-primary font-mono text-[11px] text-text-primary">
              S(t) = S_base · e^(-0.02888 · t)
            </div>
            <p className="text-[11px] text-text-muted">
              Once marked contacted, decay is frozen! Priority queue sorts lexicographically by score and uncontacted status.
            </p>
          </div>

        </div>
      </div>

      {/* API cURL Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Meta Webhook cURL */}
        <div className="rounded-2xl border border-border bg-background-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-background-elevated/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-bold text-text-primary">Meta Lead Ads Webhook Example</span>
            </div>
            <button
              onClick={() => copyCode(metaWebhookSnippet, 1)}
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedIndex === 1 ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-text-secondary overflow-x-auto bg-background-primary/50 leading-relaxed">
            {metaWebhookSnippet}
          </pre>
        </div>

        {/* WhatsApp Webhook cURL */}
        <div className="rounded-2xl border border-border bg-background-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-background-elevated/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-xs font-bold text-text-primary">WhatsApp Inbound Webhook Example</span>
            </div>
            <button
              onClick={() => copyCode(whatsappWebhookSnippet, 2)}
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1"
            >
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedIndex === 2 ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-text-secondary overflow-x-auto bg-background-primary/50 leading-relaxed">
            {whatsappWebhookSnippet}
          </pre>
        </div>

      </div>

      <AddLeadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalTab}
      />
    </div>
  );
};
