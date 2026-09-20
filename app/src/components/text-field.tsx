import { forwardRef, useState } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type TextFieldInputProps = Omit<TextInputProps, 'onBlur' | 'onChangeText' | 'value'> & {
  label: string;
  value: string;
  onBlur?: TextInputProps['onBlur'];
  onChangeText?: TextInputProps['onChangeText'];
  error?: string;
  containerClassName?: string;
};

const TextFieldInput = forwardRef<TextInput, TextFieldInputProps>(function TextFieldInput(
  { label, error, containerClassName, className, onFocus, onBlur, ...props },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={['w-full gap-2', containerClassName].filter(Boolean).join(' ')}>
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        {label}
      </ThemedText>

      <TextInput
        ref={ref}
        className={[
          'h-14 w-full rounded-xl border bg-background2 px-4 text-body text-textOnBackground2 placeholder:text-muted',
          error ? 'border-danger' : isFocused ? 'border-foreground' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
});

TextFieldInput.displayName = 'TextFieldInput';

export type TextFieldProps<TFieldValues extends FieldValues> = Omit<
  TextInputProps,
  'onBlur' | 'onChangeText' | 'value'
> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  containerClassName?: string;
};

export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  containerClassName,
  ...props
}: TextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextFieldInput
          ref={field.ref}
          label={label}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          containerClassName={containerClassName}
          {...props}
        />
      )}
    />
  );
}
