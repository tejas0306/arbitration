"use client"

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Scale, MessageSquare, BookOpen, Gavel, FileText } from 'lucide-react';
import { Control, useWatch, useFieldArray } from 'react-hook-form';
import { Controller } from 'react-hook-form';

interface ArgumentsSectionProps {
  control: Control<any>;
  prayersName: string;
  argumentsName: string;
}

export const ArgumentsSection: React.FC<ArgumentsSectionProps> = ({ 
  control, 
  prayersName, 
  argumentsName 
}) => {
  const prayers = useWatch({ control, name: prayersName }) || [];
  const { fields, replace } = useFieldArray({
    control,
    name: argumentsName,
  });

  // Sync arguments with prayers
  useEffect(() => {
    if (prayers.length > 0) {
      const newArguments = prayers.map((prayer: any, index: number) => ({
        prayerId: prayer.id || `prayer_${index}`,
        prayerTitle: prayer.title || `Prayer ${index + 1}`,
        argument: fields[index]?.argument || "",
        legalBasis: fields[index]?.legalBasis || "",
        factualBasis: fields[index]?.factualBasis || "",
        precedents: fields[index]?.precedents || ""
      }));
      replace(newArguments);
    }
  }, [prayers, replace]);

  if (prayers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Arguments</h3>
          <p className="text-sm text-gray-600 mt-1">
            Arguments will be automatically created based on your prayers
          </p>
        </div>
        
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prayers found</h3>
            <p className="text-sm text-gray-600 text-center max-w-sm">
              Please add prayers in the "Prayers & Reliefs" step first. Arguments will be automatically created for each prayer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Arguments</h3>
        <p className="text-sm text-gray-600 mt-1">
          Present your legal and factual arguments supporting each prayer
        </p>
      </div>

      <div className="space-y-6">
        {prayers.map((prayer: any, index: number) => (
          <Card key={prayer.id || index} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Argument for Prayer {index + 1}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Prayer:</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {prayer.title || `Prayer ${index + 1}`}
                    </p>
                    {prayer.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {prayer.description.length > 150 
                          ? `${prayer.description.substring(0, 150)}...` 
                          : prayer.description}
                      </p>
                    )}
                    {prayer.reliefType === "monetary" && prayer.amount && (
                      <p className="text-xs text-blue-600 mt-1">
                        Amount: ₹{parseFloat(prayer.amount).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Main Argument *
                  </label>
                  <Controller
                    control={control}
                    name={`${argumentsName}.${index}.argument`}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder={`Present your main argument supporting "${prayer.title || `Prayer ${index + 1}`}". Include why the tribunal should grant this relief...`}
                        className="w-full min-h-[120px]"
                        maxLength={2000}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Clearly explain why this prayer should be granted (max 2000 characters)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Gavel className="w-4 h-4 inline mr-1" />
                      Legal Basis
                    </label>
                    <Controller
                      control={control}
                      name={`${argumentsName}.${index}.legalBasis`}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          placeholder="Cite relevant laws, statutes, contract clauses, or legal principles..."
                          className="w-full min-h-[80px]"
                          maxLength={1000}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Factual Basis
                    </label>
                    <Controller
                      control={control}
                      name={`${argumentsName}.${index}.factualBasis`}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          placeholder="Describe the key facts that support this prayer..."
                          className="w-full min-h-[80px]"
                          maxLength={1000}
                        />
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Precedents & Case Law
                  </label>
                  <Controller
                    control={control}
                    name={`${argumentsName}.${index}.precedents`}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Reference relevant case precedents, judgments, or arbitral awards that support your position..."
                        className="w-full min-h-[80px]"
                        maxLength={1000}
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900 mb-1">Argument Guidelines</h4>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Structure each argument clearly with legal and factual foundations</li>
              <li>• Reference specific contract clauses, laws, or regulations</li>
              <li>• Include relevant case precedents and arbitral awards</li>
              <li>• Connect your facts to the legal principles</li>
              <li>• Be concise but comprehensive in your reasoning</li>
              <li>• Address potential counterarguments where possible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArgumentsSection; 