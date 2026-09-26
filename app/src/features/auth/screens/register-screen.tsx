import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';

import { useRegister } from '../hooks/use-register';
import { registerSchema, type RegisterFormValues } from '../validation/auth.schemas';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, error: registerError, loading: registerLoading } = useRegister();
  const {
    control,
    handleSubmit,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    await register({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-md flex-1 justify-center px-6 py-10 sm:px-8">
          <View className="mb-8 gap-3">
            <ThemedText type="smallBold" themeColor="foreground">
              Maranata
            </ThemedText>
            <ThemedText type="title" className="text-4xl sm:text-5xl">
              Crie sua conta
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Cadastre-se para começar a organizar os benefícios.
            </ThemedText>
          </View>

          <View className="gap-5 rounded-3xl bg-background2 p-6 shadow-lg sm:p-8">
            <TextField
              control={control}
              name="name"
              label="Nome completo"
              placeholder="Ana Souza"
              autoCapitalize="words"
              autoComplete="name"
              editable={!registerLoading}
            />

            <TextField
              control={control}
              name="email"
              label="E-mail"
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!registerLoading}
            />

            <TextField
              control={control}
              name="password"
              label="Senha"
              placeholder="8+ caracteres, maiúscula, minúscula e especial"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              editable={!registerLoading}
            />

            <TextField
              control={control}
              name="confirmPassword"
              label="Confirme sua senha"
              placeholder="Digite a senha novamente"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              editable={!registerLoading}
            />

            {registerError ? (
              <ThemedText themeColor="danger" type="small">
                {registerError.message}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={registerLoading}
              onPress={handleSubmit(onSubmit)}
              className="h-14 items-center justify-center rounded-xl bg-foreground px-6 active:opacity-80 disabled:opacity-60">
              <ThemedText type="smallBold" themeColor="textOnBackground2">
                {registerLoading ? 'Criando conta...' : 'Criar conta'}
              </ThemedText>
            </Pressable>
          </View>

          <View className="mt-8 flex-row justify-center gap-1">
            <ThemedText themeColor="textSecondary" type="small">
              Já possui uma conta?
            </ThemedText>
            <Pressable onPress={() => router.replace('/login')}>
              <ThemedText type="smallBold" themeColor="foreground">
                Entrar
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
