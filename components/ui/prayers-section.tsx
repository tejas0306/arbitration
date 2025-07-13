"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Scale, DollarSign, Gavel, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface Prayer {
  id: string;
  title: string;
  description: string;
  amount?: string;
  reliefType: "monetary" | "specific_performance" | "declaratory" | "injunction" | "costs" | "interim" | "other";
}

interface PrayersSectionProps {
  control: Control<any>;
  name: string;
}

const reliefTypeOptions = [
  { value: "monetary", label: "Monetary Relief", icon: <DollarSign className="w-4 h-4" />, description: "Seeking financial compensation" },
  { value: "specific_performance", label: "Specific Performance", icon: <CheckCircle className="w-4 h-4" />, description: "Seeking enforcement of contractual obligations" },
  { value: "declaratory", label: "Declaratory Relief", icon: <FileText className="w-4 h-4" />, description: "Seeking declaration of rights or legal position" },
  { value: "injunction", label: "Injunction", icon: <AlertCircle className="w-4 h-4" />, description: "Seeking to prevent or compel action" },
  { value: "costs", label: "Costs & Expenses", icon: <Scale className="w-4 h-4" />, description: "Seeking recovery of legal costs" },
  { value: "interim", label: "Interim Relief", icon: <Gavel className="w-4 h-4" />, description: "Seeking temporary measures" },
  { value: "other", label: "Other Relief", icon: <FileText className="w-4 h-4" />, description: "Other forms of relief" }
];

export const PrayersSection: React.FC<PrayersSectionProps> = ({ control, name }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name,
  });

  const prayers = useWatch({ control, name: name }) || [];

  const addPrayer = () => {
    append({
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      description: "",
      amount: "",
      reliefType: "monetary"
    });
  };

  const getReliefTypeInfo = (type: string) => {
    return reliefTypeOptions.find(option => option.value === type) || reliefTypeOptions[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prayers & Reliefs</h3>
          <p className="text-sm text-gray-600 mt-1">
            Specify the exact remedies and reliefs sought from the arbitral tribunal
          </p>
        </div>
        <Button
          type="button"
          onClick={addPrayer}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Prayer
        </Button>
      </div>

      {fields.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scale className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prayers added yet</h3>
            <p className="text-sm text-gray-600 mb-4 text-center max-w-sm">
              Add your first prayer to specify what relief you are seeking from the arbitral tribunal
            </p>
            <Button onClick={addPrayer} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Prayer
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const prayer = prayers[index] || {};
          const reliefInfo = getReliefTypeInfo(prayer.reliefType);
          
          return (
            <Card key={field.id} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Prayer {index + 1}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {reliefInfo.icon}
                        <span className="text-xs text-gray-600">{reliefInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relief Type *
                    </label>
                    <Controller
                      control={control}
                      name={`${name}.${index}.reliefType`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relief type" />
                          </SelectTrigger>
                          <SelectContent>
                            {reliefTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  {option.icon}
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {prayer.reliefType === "monetary" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (INR)
                      </label>
                      <Controller
                        control={control}
                        name={`${name}.${index}.amount`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="Enter amount in INR"
                            className="w-full"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prayer Title *
                  </label>
                  <Controller
                    control={control}
                    name={`${name}.${index}.title`}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Brief title for this prayer (e.g., 'Payment of Outstanding Dues')"
                        className="w-full"
                        maxLength={100}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <Controller
                    control={control}
                    name={`${name}.${index}.description`}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Provide detailed description of what you are seeking from the tribunal..."
                        className="w-full min-h-[100px]"
                        maxLength={1000}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific about what you want the tribunal to order or declare
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Scale className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Prayer Guidelines</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Be specific and clear about what relief you seek</li>
              <li>• Include monetary amounts where applicable</li>
              <li>• Consider interim measures if urgent relief is needed</li>
              <li>• Request costs and expenses as a separate prayer</li>
              <li>• Each prayer should address a distinct form of relief</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayersSection; 