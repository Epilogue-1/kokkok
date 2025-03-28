import { Redirect, Stack } from "expo-router";

import { Header, HeaderWithBack } from "@/components/Header";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useQueryClient } from "@tanstack/react-query";

const AuthLayout = () => {
  const queryClient = useQueryClient();
  const { isLoggedIn, isLoading } = useAuthSession(queryClient);

  if (isLoading) return null;
  if (isLoggedIn) return <Redirect href="/home" />;

  return (
    <>
      <Stack>
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-up/step1"
          options={{
            header: () => <HeaderWithBack name="SIGNUP" />,
          }}
        />
        <Stack.Screen
          name="sign-up/step2"
          options={{
            header: () => <HeaderWithBack name="SIGNUP" />,
          }}
        />
      </Stack>
    </>
  );
};

export default AuthLayout;
