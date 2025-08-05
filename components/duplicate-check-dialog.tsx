"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DuplicateCase {
  id: string;
  caseNumber: string;
  score: number;
  matchReasons: string[];
  createdAt: Date;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  score: number;
  matchingCases: DuplicateCase[];
  threshold: number;
}

interface DuplicateCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onEditExisting: () => void;
  duplicateResult: DuplicateCheckResult;
}

const DuplicateCheckDialog: React.FC<DuplicateCheckDialogProps> = ({
  isOpen,
  onClose,
  onContinue,
  onEditExisting,
  duplicateResult,
}) => {
  if (!duplicateResult) {
    return null;
  }

  const { matchingCases } = duplicateResult;
  const existingCase = matchingCases[0]; // Get the first matching case

  return (
    <AlertDialog open={isOpen} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <AlertDialogTitle>Case Already Submitted</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            A case with the same name has already been submitted. Would you like to continue with a new submission or edit the existing case?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Existing Case Info */}
          {existingCase && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Existing Case:</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Case Number:</strong> {existingCase.caseNumber}</p>
                <p><strong>Submitted:</strong> {new Date(existingCase.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Submitting duplicate cases may result in case rejection or delays.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onEditExisting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Edit Existing
          </AlertDialogAction>
          <AlertDialogAction 
            onClick={onContinue}
            className="bg-green-600 hover:bg-green-700"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DuplicateCheckDialog; 