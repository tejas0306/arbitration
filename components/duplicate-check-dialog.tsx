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
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, FileText, Users, Calendar } from 'lucide-react';

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
  onConfirm: () => void;
  duplicateResult: DuplicateCheckResult;
}

const DuplicateCheckDialog: React.FC<DuplicateCheckDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  duplicateResult,
}) => {
  if (!duplicateResult) {
    return null;
  }
  const { isDuplicate, score, matchingCases, threshold } = duplicateResult;

  const getSeverityColor = (score: number) => {
    if (score >= threshold) return 'destructive';
    if (score >= 0.6) return 'warning';
    return 'secondary';
  };

  const getSeverityText = (score: number) => {
    if (score >= threshold) return 'High Risk';
    if (score >= 0.6) return 'Moderate Risk';
    return 'Low Risk';
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-6 w-6 ${isDuplicate ? 'text-red-500' : 'text-yellow-500'}`} />
            <AlertDialogTitle>
              {isDuplicate ? 'Duplicate Case Detected' : 'Similar Cases Found'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isDuplicate 
              ? 'We found cases that appear very similar to the one you\'re submitting. Please review these matches carefully.'
              : 'We found some cases that share similarities with your submission. Please review to ensure this is not a duplicate.'
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Overall Score */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Overall Similarity Score:</span>
            <div className="flex items-center gap-2">
              <Badge variant={getSeverityColor(score)}>
                {Math.round(score * 100)}%
              </Badge>
              <span className="text-sm text-gray-600">
                ({getSeverityText(score)})
              </span>
            </div>
          </div>

          {/* Matching Cases */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Similar Cases ({matchingCases.length})
            </h4>
            
            {matchingCases.map((matchingCase, index) => (
              <div key={matchingCase.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Case #{matchingCase.caseNumber}</span>
                    <Badge variant={getSeverityColor(matchingCase.score)} size="sm">
                      {Math.round(matchingCase.score * 100)}% match
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(matchingCase.createdAt), { addSuffix: true })}
                  </div>
                </div>
                
                {matchingCase.matchReasons.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Match Reasons:</span>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {matchingCase.matchReasons.map((reason, reasonIndex) => (
                        <li key={reasonIndex} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Warning Message */}
          {isDuplicate && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Submitting duplicate cases may result in case rejection or delays. 
                Please ensure this is a legitimate new case before proceeding.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel Submission
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={isDuplicate ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isDuplicate ? 'Proceed Anyway' : 'Continue Submission'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DuplicateCheckDialog; 