import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useAppContext } from '../../context/AppContext';
import type { Lead } from '../../data/mockData';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead, fetchLeads } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    leadSource: 'Instagram',
    placement: 'Reels',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a mock lead
    const newLead: Lead = {
      id: `L-${Math.floor(Math.random() * 9000) + 1000}`,
      ...formData,
      leadOrigin: 'Manual Entry',
      audienceType: 'Unknown',
      ctr: 0,
      cpc: 0,
      creativeType: 'N/A',
      totalVisits: 1,
      timeOnWebsite: 0,
      pageViews: 1,
      lastActivity: 'Manual Entry',
      baseScore: 50,
      currentScore: 50,
      conversionProbability: 50,
      hoursUncontacted: 0,
      status: 'Warm',
      confidence: 'Uncertain',
      predictionLower: 40,
      predictionUpper: 60,
      submissionTime: new Date().toISOString(),
      contacted: false,
    };
    
    addLead(newLead);
    onClose();
  };

  const inputClasses = "w-full bg-input-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors";
  const labelClasses = "block text-xs font-medium text-text-secondary mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/80 backdrop-blur-sm">
      <div className="bg-background-card border border-border rounded-xl shadow-card-dark light:shadow-card-light w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Add New Lead</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClasses}>Full Name</label>
            <input 
              required
              type="text" 
              className={inputClasses}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Email</label>
              <input 
                required
                type="email" 
                className={inputClasses}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className={labelClasses}>Phone</label>
              <input 
                type="tel" 
                className={inputClasses}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Lead Source</label>
              <select 
                className={inputClasses}
                value={formData.leadSource}
                onChange={(e) => setFormData({...formData, leadSource: e.target.value})}
              >
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Audience Network</option>
                <option>Organic</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Placement</label>
              <select 
                className={inputClasses}
                value={formData.placement}
                onChange={(e) => setFormData({...formData, placement: e.target.value})}
              >
                <option>Reels</option>
                <option>Stories</option>
                <option>Feed</option>
                <option>Marketplace</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Lead</Button>
          </div>
        </form>

        <div className="p-6 border-t border-border">
          <h3 className="text-sm font-medium mb-3">Or Upload Dataset (CSV)</h3>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".csv"
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await fetch('http://localhost:8000/api/upload', {
                      method: 'POST',
                      body: formData
                    });
                    if (res.ok) {
                      await fetchLeads();
                      onClose();
                    } else {
                      alert('Failed to upload dataset.');
                    }
                  } catch (err) {
                    alert('Error uploading dataset.');
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
