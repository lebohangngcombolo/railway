import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Users,
} from "lucide-react";
import api from "../services/api";

// Removed unused steps variable

const gradientBtn =
  "bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 hover:from-blue-700 hover:to-purple-600 text-white";

const ClaimSubmission: React.FC = () => {
  const { user, loading } = useAuth();

  // Step state
  const [step, setStep] = useState(0);

  // Stokvel selection
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Terms
  const [groupRules, setGroupRules] = useState<string>("");
  const [agreed, setAgreed] = useState(false);

  // Claim details
  const [claimAmount, setClaimAmount] = useState<number | null>(null);
  const [reason, setReason] = useState(""); // This will be set on submit of StepClaimDetails
  const [errors, setErrors] = useState<{ reason?: string }>({});

  // Uploads (NO additional documents)
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [deathCertificate, setDeathCertificate] = useState<File | null>(null);
  const [proofOfResidence, setProofOfResidence] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Reason for claim
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  // --- MOCK: Load groups on mount ---
  useEffect(() => {
    api.get("/api/dashboard/my-groups")
      .then(res => {
        const data = res.data;
        // Only include Burial and Investments
        const filtered = data.filter((group: any) => {
          const cat = group.category?.toLowerCase();
          return cat === "burial" || cat === "investments" || cat === "investment";
        });
        setGroups(filtered);
      })
      .catch(() => setGroups([]));
  }, []);

  // When group is selected, update rules and amount
  useEffect(() => {
    if (!selectedGroup) {
      setGroupRules("");
      setClaimAmount(null);
      return;
    }
    setGroupRules(selectedGroup.rules);
    setClaimAmount(selectedGroup.claimable_amount);
  }, [selectedGroup]);

  if (loading) return <div className="flex justify-center items-center h-96">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // --- Stepper UI ---
  // Removed unused Stepper variable

  // --- Step 0: Select Stokvel ---
  const StepSelectStokvel = () => (
        <form
          onSubmit={e => {
            e.preventDefault();
        if (selectedGroup) setStep(1);
      }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-extrabold mb-2 text-gray-800">Choose a Stokvel Group</h2>
        <p className="text-gray-500 mb-6">Select the group you want to claim from.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {groups.map(group => (
            <button
              type="button"
              key={group.id}
              className={`rounded-2xl border-2 p-6 text-left shadow-xl transition-all flex flex-col gap-2
                ${selectedGroup?.id === group.id
                  ? "border-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 ring-2 ring-blue-200"
                  : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-lg">{group.name}</span>
              </div>
              <div className="text-xs text-gray-500">{group.category}</div>
              <div className="text-xs text-gray-400 mt-2">{group.rules ? group.rules.slice(0, 40) : "No rules provided"}...</div>
              {selectedGroup?.id === group.id && (
                <div className="mt-2 text-blue-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Selected
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg text-lg ${gradientBtn}`}
          disabled={!selectedGroup}
        >
          Next <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );

  // --- Step 1: Terms & Conditions ---
  const StepTerms = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-extrabold mb-2 text-gray-800">Terms & Conditions</h2>
      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-base shadow-lg border max-h-56 overflow-y-auto">
        {groupRules}
      </div>
      <div className="flex items-center mt-4">
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mr-2 accent-blue-600"
        />
        <label htmlFor="agree" className="text-base">I have read and agree to the terms and conditions.</label>
      </div>
      <div className="flex justify-between">
        <button
          className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          onClick={() => setStep(0)}
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg text-lg ${gradientBtn}`}
          onClick={() => setStep(2)}
          disabled={!agreed}
        >
          Next <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // --- Step 2: Claim Details ---
  const commonReasons = [
    "Death in family",
    "Medical emergency",
    "Education",
    "Unemployment",
    "Funeral expenses",
    "Other"
  ];

  const StepClaimDetails = () => (
    <form
      onSubmit={e => {
        e.preventDefault();
        const finalReason = selectedReason === "Other" ? customReason : selectedReason;
        if (!finalReason) {
          setErrors({ reason: "Please provide a reason for your claim" });
          return;
        }
        setReason(finalReason); // Save the final reason to main state
        setErrors({});
        setStep(3);
      }}
      className="space-y-8"
    >
      <h2 className="text-2xl font-extrabold mb-2 text-gray-800">Claim Details</h2>
          <div>
        <label className="block font-semibold mb-1">Claim Amount</label>
            <input
          type="text"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-lg font-bold"
          value={claimAmount !== null ? `R${claimAmount}` : ""}
          readOnly
        />
          </div>
          <div>
            <label className="block font-semibold mb-1">Reason for Claim</label>
        <select
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mb-2"
          value={selectedReason}
          onChange={e => {
            setSelectedReason(e.target.value);
            if (e.target.value !== "Other") setCustomReason("");
          }}
        >
          <option value="">Select a reason...</option>
          {commonReasons.map(reason => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
        </select>
        {selectedReason === "Other" && (
            <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mt-2"
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
              rows={3}
            placeholder="Please specify your reason"
            />
        )}
        {errors.reason && <div className="text-red-500 text-sm mt-1">{errors.reason}</div>}
          </div>
      <div className="flex justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          onClick={() => setStep(1)}
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          type="submit"
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg text-lg ${gradientBtn}`}
        >
          Next <ArrowRight className="w-5 h-5" />
        </button>
      </div>
        </form>
  );

  // --- Step 3: Upload Documents (NO additional documents) ---
  const StepUploadDocs = () => (
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!idDocument || !deathCertificate || !proofOfResidence) {
              setFileError("Please upload all required documents.");
              return;
            }
            setFileError("");
        setStep(4);
          }}
      className="space-y-8"
        >
      <h2 className="text-2xl font-extrabold mb-2 text-gray-800">Upload Documents</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-1">ID Document <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setIdDocument(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500"
            />
          {idDocument && <div className="text-xs text-gray-600">{idDocument.name}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Death Certificate <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setDeathCertificate(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500"
            />
          {deathCertificate && <div className="text-xs text-gray-600">{deathCertificate.name}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Proof of Residence <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setProofOfResidence(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500"
          />
          {proofOfResidence && <div className="text-xs text-gray-600">{proofOfResidence.name}</div>}
              </div>
          </div>
          {fileError && <div className="text-red-500">{fileError}</div>}
      <div className="flex justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          onClick={() => setStep(2)}
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          type="submit"
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg text-lg ${gradientBtn}`}
        >
          Next <ArrowRight className="w-5 h-5" />
        </button>
          </div>
        </form>
  );

  // --- Step 4: Review & Submit (NO additional documents) ---
  const StepReview = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-extrabold mb-2 text-gray-800">Review & Submit</h2>
      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 space-y-2 shadow-lg border">
        <div><span className="font-semibold">Stokvel Group:</span> {selectedGroup?.name}</div>
        <div><span className="font-semibold">Amount:</span> R{claimAmount}</div>
            <div><span className="font-semibold">Reason:</span> {reason}</div>
            <div><span className="font-semibold">ID Document:</span> {idDocument?.name}</div>
            <div><span className="font-semibold">Death Certificate:</span> {deathCertificate?.name}</div>
            <div><span className="font-semibold">Proof of Residence:</span> {proofOfResidence?.name}</div>
            </div>
      {submitError && <div className="text-red-500">{submitError}</div>}
      <div className="flex justify-between">
        <button
          className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          onClick={() => setStep(3)}
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
            <button
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg text-lg ${gradientBtn}`}
          onClick={async () => {
            setIsSubmitting(true);
            setSubmitError("");
            try {
              // await api.post("/api/claims", ...);
            } catch (err) {
              setSubmitError("Failed to submit claim.");
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </div>
  );

  // --- Main Render ---
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Breadcrumbs */}
      {/* Stepper */}
      {/* Step content */}
      {/* Success screen is removed as per edit hint */}
      {step === 0 && <StepSelectStokvel />}
      {step === 1 && <StepTerms />}
      {step === 2 && <StepClaimDetails />}
      {step === 3 && <StepUploadDocs />}
      {step === 4 && <StepReview />}
    </div>
  );
};

export default ClaimSubmission;
