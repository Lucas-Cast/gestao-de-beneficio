import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { ThemedButton } from "@/components/ui/themed-button";
import { TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";

import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginFormValues } from "../validation/auth.schemas";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading: loginLoading } = useLogin();
  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await login({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md flex-1 justify-center px-6 py-12 sm:px-8">
          <View className="mb-10 gap-3">
            <ThemedText type="smallBold" themeColor="foreground">
              Maranata
            </ThemedText>
            <ThemedText type="title" className="text-4xl sm:text-5xl">
              Bem-vindo de volta
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Entre para acompanhar e administrar os benefícios.
            </ThemedText>
          </View>

          <View className="gap-5 rounded-3xl bg-background2 p-6 shadow-lg sm:p-8">
            <TextField
              control={control}
              name="email"
              label="E-mail"
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!loginLoading}
            />

            <TextField
              control={control}
              name="password"
              label="Senha"
              placeholder="Digite sua senha"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              editable={!loginLoading}
            />

            <ThemedButton
              label={loginLoading ? "Entrando..." : "Entrar"}
              loading={loginLoading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View className="mt-8 flex-row justify-center gap-1">
            <ThemedText themeColor="textSecondary" type="small">
              Ainda não tem uma conta?
            </ThemedText>
            <Pressable onPress={() => router.push("/register")}>
              <ThemedText type="smallBold" themeColor="foreground">
                Cadastre-se
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
