"use client"
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { arbitrationApi, auth, api } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic';
import { useForm, useFieldArray, Controller, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getApiUrl } from '@/lib/config';


function ArbitrationAIForm() {

  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = () => {
  if (!file) return;
  setLoading(true);

  const formData = new FormData();
  formData.append('file', file);

  arbitrationApi.uploadFileToAI(formData)
    .then((fileId) => {
      console.log('📁 Uploaded. Got fileId:', fileId);

      return arbitrationApi.generateAIResponse(fileId)
        .then((res) => {
          const formattedDate = parseToMMDDYYYY(res.agreementDate);
          if (formattedDate) {
            res.agreementDate = formattedDate;
          }
		setShowForm(true);
          setForm(res);
          console.log('🎉 Got AI response:', res);
        })
        .catch((error) => {
          console.error('❌ generateAIResponse failed:', error.message);

          if (error.response?.status === 500) {
            console.warn('Retrying from file due to server error...');

            return arbitrationApi.readAIResponseFromFile(fileId)
              .then((res) => {
                const formattedDate = parseToMMDDYYYY(res.agreementDate);
                if (formattedDate) {
                  res.agreementDate = formattedDate;
                }
				setShowForm(true);
                setForm(res);
                console.log('📄 Fetched AI response from file:', res);
              })
              .catch((err) => {
                console.error('❌ readAIResponseFromFile failed:', err.message);
              });
          } else {
            throw error;
          }
        });
    })
    .catch((error) => {
      console.error('❌ uploadFileToAI failed:', error.message);
    })
    .finally(() => {
      setLoading(false);
    });
};
  
  
    const [form, setForm] = useState({
    agreementDate: '',
    placeOfSigning: '',
    supporting_documents: [''],
    parties: [{
      name: '',
      address: '',
      phone: '',
      email: '',
      CIN: '',
      PAN: '',
      GST: '',
      obligations: [{ clauseNumber: '', clauseText: '', description: '' }],
    }],
    penalty_clauses: [{ clauseNumber: '', description: '', penaltyDetails: '' }],
    arbitration_clause: {
      amicable_settlement: '',
      arbitration: '',
      seat_and_venue: '',
      language: '',
      costs: ''
    },
	clauses: [{ clauseNumber: '', description: '', clauseText: '' }],
  });

  const updatePartyField = (index: number, key: string, value: any) => {
    const updatedParties = [...form.parties];
    updatedParties[index][key] = value;
    setForm(prev => ({ ...prev, parties: updatedParties }));
  };

  const updatePartyList = (index: number, listName: string, itemIndex: number, value: string) => {
    const updatedParties = [...form.parties];
    updatedParties[index][listName][itemIndex] = value;
    setForm(prev => ({ ...prev, parties: updatedParties }));
  };

  const updateSupportingDocuments = (index: number, key: string, value: string) => {
    const updated = [...form.supporting_documents];
    updated[index] = value;
    setForm(prev => ({
      ...prev,
      supporting_documents: updated
    }));
  };


  const updateObligation = (partyIndex: number, obligationIndex: number, key: string, value: string) => {
    const updatedParties = [...form.parties];
    updatedParties[partyIndex].obligations[obligationIndex][key] = value;
    setForm(prev => ({ ...prev, parties: updatedParties }));
  };

  const updatePenalty = (index: number, key: string, value: string) => {
    const updated = [...form.penalty_clauses];
    updated[index][key] = value;
    setForm(prev => ({
      ...prev,
      penalty_clauses: updated
    }));
  };

  const updateClause = (index: number, key: string, value: string) => {
    const updated = [...form.clauses];
    updated[index][key] = value;
    setForm(prev => ({
      ...prev,
      clauses: updated
    }));
  };
  
	const [showForm, setShowForm] = useState(false);


  return (
    <main className="p-10 max-w-7xl mx-auto">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Upload Agreement PDF</h1>

        <div className="grid grid-cols-2 gap-4">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2"
            disabled={!file || loading}
          >
            {loading ? 'Processing...' : 'Extract Agreement Info'}
          </button>
        </div>

        {showForm && (
          <>
            <p className="text-gray-600">Agreement Details extracted using AI</p>
			{/* Agreement Info */}
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div>
                <label className="block font-semibold mb-1">Agreement Date:</label>
                <input
                  type="date"
                  value={form.agreementDate}
                  onChange={(e) => setForm({ ...form, agreementDate: e.target.value })}
                  className="w-full border px-2 py-1"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Place of Signing:</label>
                <input
                  type="text"
                  value={form.placeOfSigning}
                  onChange={(e) => setForm({ ...form, placeOfSigning: e.target.value })}
                  className="w-full border px-2 py-1"
                />
              </div>
            </div>
			
			<p className="text-gray-600">Party Details</p>

            {/* Party Info Side-by-Side */}
            <div className="grid grid-cols-2 gap-6">
              {form.parties?.map((party, idx) => (
              <div key={idx} className="border p-4 mt-6">
                <h2 className="font-semibold text-lg">Party {idx + 1}</h2>
                {Object.keys(party).filter(k => typeof party[k] === 'string').map(field => (
                  <div key={field} className="mb-2">
                    <label className="block font-medium">{field.toUpperCase()}:</label>
                    <input
                      type="text"
                      value={party[field]}
                      onChange={(e) => updatePartyField(idx, field, e.target.value)}
                      className="w-full border px-2 py-1"
                    />
                  </div>
                ))}
                <div>
                  <h3 className="font-medium mt-2">Obligations</h3>
                  {party.obligations.map((ob, obIdx) => (
                    <div key={obIdx} className="border p-2 mb-2">
                      <label className="block font-medium mb-1">Clause Number:</label>
					  <input
                        type="text"
                        placeholder="Clause Number"
                        value={ob.clauseNumber}
                        onChange={(e) => updateObligation(idx, obIdx, 'clauseNumber', e.target.value)}
                        className="w-full border px-2 py-1 mb-1"
                      />
                      <label className="block font-medium mb-1">Clause Text:</label>
					  <textarea
                        placeholder="Clause Text"
                        value={ob.clauseText}
                        onChange={(e) => updateObligation(idx, obIdx, 'clauseText', e.target.value)}
                        className="w-full border px-2 py-1 mb-1"
                        rows={2}
                      />
                      <label className="block font-medium mb-1">Clause Summary:</label>
					  <textarea
                        placeholder="Description"
                        value={ob.description}
                        onChange={(e) => updateObligation(idx, obIdx, 'description', e.target.value)}
                        className="w-full border px-2 py-1"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>

            {/* Penalty Clauses */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-4">Penalty Clauses</h2>
              {form.penalty_clauses?.map((pc, idx) => (
                <div key={idx} className="mb-2 border p-2">
				  <label className="block font-medium mb-1">Clause Number:</label>
                  <textarea
                    placeholder="Clause Number"
                    value={pc.clauseNumber}
                    onChange={(e) => updatePenalty(idx, 'clauseNumber', e.target.value)}
                    className="w-full border px-2 py-1 mt-1"
                    rows={2}
                  />
				  <label className="block font-medium mb-1">Description:</label>
                  <textarea
                    placeholder="Description"
                    value={pc.description}
                    onChange={(e) => updatePenalty(idx, 'description', e.target.value)}
                    className="w-full border px-2 py-1 mt-1"
                    rows={5}
                  />
                  <label className="block font-medium mb-1">Penalty Details:</label>
				  <textarea
                    placeholder="Penalty Details"
                    value={pc.penaltyDetails}
                    onChange={(e) => updatePenalty(idx, 'penaltyDetails', e.target.value)}
                    className="w-full border px-2 py-1 mt-1"
                    rows={5}
                  />
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-4">Supporting Documents</h2>
              {form.supporting_documents?.map((pc, idx) => (
                <div key={idx} className="mb-2 border p-2">
                  <textarea
                    placeholder="Supporting Documents"
                    value={pc}
                    onChange={(e) => updateSupportingDocuments(idx, 'supporting_documents', e.target.value)}
                    className="w-full border px-2 py-1 mt-1"
                    rows={2}
                  />
                </div>
              ))}
            </div>		
			

            {/* Arbitration Clause */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-4">Arbitration Clauses</h2>
              {Object.entries(form.arbitration_clause).map(([key, val]) => {
                const labelMap: Record<string, string> = {
                  amicable_settlement: 'Amicable Settlement',
                  arbitration: 'Arbitration',
                  seat_and_venue: 'Seat and Venue',
                  language: 'Language',
                  costs: 'Cost',
				  arbitral_tribunal:'Arbitral Tribunal',
				  final_and_binding: 'Final and Binding',
				  
                };
                const label = labelMap[key.trim()] || key;

                return (
                  <label key={key} className="block mb-3">
                    <span className="font-medium">{label}:</span>
                    <textarea
                      value={val}
                      onChange={(e) =>
                        setForm(prev => ({
                          ...prev,
                          arbitration_clause: {
                            ...prev.arbitration_clause,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="w-full border px-2 py-1 mt-1"
                      rows={5}
                    />
                  </label>
                );
              })}
            </div>
			
			            {/* Penalty Clauses */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-4">All Clauses</h2>
              {form.clauses?.map((pc, idx) => (
                <div key={idx} className="mb-2 border p-2">
				  <label className="block font-medium mb-1">Clause Number:</label>
                  <textarea
                    placeholder="Clause Number"
                    value={pc.clauseNumber}
                    onChange={(e) => updateClause(idx, 'clauseNumber', e.target.value)}
                    className="w-full border px-2 py-1 mt-1"
                    rows={2}
                  />
                  <label className="block font-medium mb-1">Clause Text:</label>
				  <textarea
                    placeholder="Penalty Details"
                    value={pc.clauseText}
                    onChange={(e) => updateClause(idx, 'clauseText', e.target.value)}
                    className="w-full border px-2 py-1 mt-1"
                    rows={5}
                  />
				  <label className="block font-medium mb-1">Description:</label>
                  <textarea
                    placeholder="Description"
                    value={pc.description}
                    onChange={(e) => updateClause(idx, 'description', e.target.value)}
                    className="w-full border px-2 py-1 mt-1"
                    rows={5}
                  />
                </div>
              ))}
            </div>
			
			
          </>
        )}
      </div>
    </main>
  );
}

// Export with dynamic to disable SSR
export default dynamic(() => Promise.resolve(ArbitrationAIForm), { 
  ssr: false 
});

function parseToMMDDYYYY(input) {
  try {
    // Remove common suffixes (e.g., "22nd" → "22")
    const normalized = input.replace(/(\d+)(st|nd|rd|th)/gi, '$1');

    const parsed = new Date(normalized);
    if (isNaN(parsed)) return null;

    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const yyyy = parsed.getFullYear();

    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return null;
  }
}