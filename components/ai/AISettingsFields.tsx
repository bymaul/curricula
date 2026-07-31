import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AIProvider, AI_PROVIDERS } from '@/lib/consts';

interface AISettingsFieldsProps {
  provider: AIProvider;
  modelName: string;
  apiKey: string;
  onProviderChange: (value: AIProvider | null) => void;
  onModelChange: (value: string) => void;
  onKeyChange: (value: string) => void;
}

export function AISettingsFields({
  provider,
  modelName,
  apiKey,
  onProviderChange,
  onModelChange,
  onKeyChange,
}: AISettingsFieldsProps) {
  const selectedProvider = AI_PROVIDERS.find((p) => p.value === provider);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Provider</FieldLabel>
          <Select value={provider} onValueChange={onProviderChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {AI_PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Model</FieldLabel>
          <FieldDescription>
            Optional. Defaults to {selectedProvider?.defaultModel}.
          </FieldDescription>
          <Input
            value={modelName}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={selectedProvider?.defaultModel}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>API Key</FieldLabel>
        <FieldDescription>
          Kept in this browser tab only, never stored permanently.
        </FieldDescription>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="sk-..."
          autoComplete="off"
        />
      </Field>
    </>
  );
}
