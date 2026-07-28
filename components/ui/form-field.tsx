import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldPath, FieldValues, UseFormRegister } from 'react-hook-form';

type FormFieldProps<T extends FieldValues> = {
    name: FieldPath<T>;
    label?: string;
    placeholder?: string;
    type?: string;
    register: UseFormRegister<T>;
    error?: string;
    className?: string;
    as?: 'input' | 'textarea';
    textareaClassName?: string;
};

export function FormField<T extends FieldValues>({
    name,
    label,
    placeholder,
    type = 'text',
    register,
    error,
    className,
    as = 'input',
    textareaClassName,
}: FormFieldProps<T>) {
    return (
        <Field className={className}>
            {label && <FieldLabel>{label}</FieldLabel>}
            {as === 'textarea' ? (
                <Textarea
                    {...register(name)}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    className={textareaClassName ?? 'min-h-30 resize-y'}
                />
            ) : (
                <Input type={type} {...register(name)} placeholder={placeholder} aria-invalid={!!error} />
            )}
            {error && <FieldError>{error}</FieldError>}
        </Field>
    );
}
