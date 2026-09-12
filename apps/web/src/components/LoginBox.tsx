import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, signup } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../api/client";

export function LoginBox() {
  const setToken = useAuthStore((s) => s.setToken);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => setToken(data.token),
  });

  const signupMutation = useMutation({
    mutationFn: signup,
  });

  const isPending = loginMutation.isPending || signupMutation.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { username, password },
      {
        onError: (err) => window.alert(getErrorMessage(err)),
      },
    );
  };

  const handleSignUp = () => {
    if (!username || !password) {
      window.alert("Enter a username and password first.");
      return;
    }
    signupMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          loginMutation.mutate(
            { username, password },
            {
              onError: (err) => window.alert(getErrorMessage(err)),
            },
          );
        },
        onError: (err) => window.alert(getErrorMessage(err)),
      },
    );
  };

  const errorMessage =
    (loginMutation.isError && getErrorMessage(loginMutation.error)) ||
    (signupMutation.isError && getErrorMessage(signupMutation.error)) ||
    null;

  return (
    <form onSubmit={submit}>
      <div className="box-title">login</div>
      <div className="field">
        <label htmlFor="login-username">username</label>
        <input
          id="login-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="login-password">password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <button type="submit" disabled={isPending}>
        {loginMutation.isPending ? "Logging in…" : "Login"}
      </button>
      <button type="button" onClick={handleSignUp} disabled={isPending}>
        {signupMutation.isPending ? "Signing up…" : "Sign up"}
      </button>
      {errorMessage && <div className="error">{errorMessage}</div>}
    </form>
  );
}