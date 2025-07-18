"use client"

import React from 'react';
import { CheckCircle, Circle, Clock, FileText, Users, Gavel, Scale, DollarSign, MessageSquare, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FormStepSidebarProps {
  currentStep: number;
  completedSteps: number[];
  steps: Step[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

const defaultSteps: Step[] = [
  {
    id: 0,
    title: "Step 1: Claimant Details",
    description: "Personal and business information",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 1,
    title: "Step 2: Additional Claimants",
    description: "Co-claimants and authorized managers",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Step 3: Respondent Details",
    description: "Opposing party information",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Step 4: Arbitration Agreement",
    description: "Agreement terms and arbitrator selection",
    icon: <Gavel className="w-5 h-5" />
  },
  {
    id: 4,
    title: "Step 5: Nature of Dispute",
    description: "Category and background details",
    icon: <Scale className="w-5 h-5" />
  },
  {
    id: 5,
    title: "Step 6: Dispute Description",
    description: "Detailed claims and supporting facts",
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 6,
    title: "Step 7: Prayers & Reliefs",
    description: "Specific remedies sought",
    icon: <Scale className="w-5 h-5" />
  },
  {
    id: 7,
    title: "Step 8: Documents",
    description: "Evidence and supporting files",
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 8,
    title: "Step 9: Payment",
    description: "Fee structure and payment details",
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 9,
    title: "Step 10: Arguments",
    description: "Legal arguments for each prayer",
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    id: 10,
    title: "Step 11: Review & Submit",
    description: "Final review before submission",
    icon: <Eye className="w-5 h-5" />
  }
];

export const FormStepSidebar: React.FC<FormStepSidebarProps> = ({
  currentStep,
  completedSteps = [],
  steps = defaultSteps,
  onStepClick,
  className
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'accessible';
    return 'upcoming';
  };

  const getStepIcon = (step: Step, status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Circle className="w-5 h-5 text-blue-600 fill-blue-100" />;
      case 'accessible':
        return step.icon;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={cn("w-80 bg-white border-r border-gray-200 h-full overflow-y-auto", className)}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Arbitration Petition</h2>
        <p className="text-sm text-gray-600 mb-6">Complete all steps to submit your petition</p>
        
        <div className="space-y-1">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = onStepClick && (status === 'completed' || status === 'current' || status === 'accessible');
            
            return (
              <div
                key={step.id}
                className={cn(
                  "group relative flex items-start p-3 rounded-lg transition-all duration-200",
                  {
                    "bg-blue-50 border-l-4 border-blue-500": status === 'current',
                    "bg-green-50 border-l-4 border-green-500": status === 'completed',
                    "hover:bg-gray-50": isClickable && status !== 'current',
                    "cursor-pointer": isClickable,
                    "opacity-60": status === 'upcoming'
                  }
                )}
                onClick={() => isClickable && onStepClick(index)}
              >
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  {getStepIcon(step, status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "text-sm font-medium",
                      {
                        "text-blue-900": status === 'current',
                        "text-green-900": status === 'completed',
                        "text-gray-900": status === 'accessible',
                        "text-gray-500": status === 'upcoming'
                      }
                    )}>
                      {step.title}
                    </h3>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      {
                        "bg-blue-100 text-blue-800": status === 'current',
                        "bg-green-100 text-green-800": status === 'completed',
                        "bg-gray-100 text-gray-600": status === 'accessible' || status === 'upcoming'
                      }
                    )}>
                      {index + 1}
                    </span>
                  </div>
                  
                  <p className={cn(
                    "text-xs mt-1",
                    {
                      "text-blue-700": status === 'current',
                      "text-green-700": status === 'completed',
                      "text-gray-600": status === 'accessible',
                      "text-gray-400": status === 'upcoming'
                    }
                  )}>
                    {step.description}
                  </p>
                  
                  {status === 'completed' && (
                    <div className="mt-1">
                      <span className="text-xs text-green-600 font-medium">✓ Complete</span>
                    </div>
                  )}
                  
                  {status === 'current' && (
                    <div className="mt-1">
                      <span className="text-xs text-blue-600 font-medium">→ In Progress</span>
                    </div>
                  )}
                </div>
                
                {/* Progress connector line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    "absolute left-6 top-12 w-0.5 h-6",
                    {
                      "bg-green-300": status === 'completed',
                      "bg-blue-300": status === 'current',
                      "bg-gray-200": status === 'accessible' || status === 'upcoming'
                    }
                  )} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">
              {completedSteps.length + (currentStep >= 0 ? 1 : 0)} of {steps.length}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((completedSteps.length + (currentStep >= 0 ? 1 : 0)) / steps.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormStepSidebar; 