"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OAuthProvider } from "node-appwrite";
import { createAdminClient } from "./appwrite";

export async function signUpWithGithub(next?: string) {
	const { account } = await createAdminClient();

  const origin = headers().get("origin");

  const successUrl = next ? `${origin}/oauth?next=${encodeURIComponent(next)}` : `${origin}/oauth`;

	const redirectUrl = await account.createOAuth2Token(
		OAuthProvider.Github,
		successUrl,
		`${origin}/sign-up`,
	);

	return redirect(redirectUrl);
};

export async function signUpWithGoogle(next?: string){
    const { account } = await createAdminClient();

  const origin = headers().get("origin");

  const successUrl = next ? `${origin}/oauth?next=${encodeURIComponent(next)}` : `${origin}/oauth`;

	const redirectUrl = await account.createOAuth2Token(
		OAuthProvider.Google,
		successUrl,
		`${origin}/sign-up`,
	);

	return redirect(redirectUrl);
}
