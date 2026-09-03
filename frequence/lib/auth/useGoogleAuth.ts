import { useCallback } from "react";
import * as WebBrowser from 'expo-web-browser';
import { supabase } from "../services/supabase";
import { authErrorMessage } from "./authErrors";

//Au niveau du module: ne doit pas être appelé à chaque rendre.
WebBrowser.maybeCompleteAuthSession();

const REDIRECT_TO = 'frequence://auth/callback';

export type GoogleAuthResult = { ok: boolean; cancelled?: boolean; error?: string };

export function useGoogleAuth() {
  return useCallback(async (): Promise<GoogleAuthResult> => {
    try { 
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: REDIRECT_TO, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_TO);
      if (result.type !== 'success') return { ok: false, cancelled: true };

      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
      if (sessionError) throw sessionError;

      return { ok: true };
    } catch (err) {
      return { ok: false, error: authErrorMessage(err)};
    }
  }, []);
}