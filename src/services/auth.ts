import * as vscode from 'vscode';

const API_KEY_SECRET = 'geminiApiKey';

/**
 * Retrieves the Gemini API key from SecretStorage
 */
export async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    return await context.secrets.get(API_KEY_SECRET);
}

/**
 * Stores the Gemini API key in SecretStorage
 */
export async function setApiKey(context: vscode.ExtensionContext, key: string): Promise<void> {
    await context.secrets.store(API_KEY_SECRET, key);
}

/**
 * Removes the Gemini API key from SecretStorage
 */
export async function deleteApiKey(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete(API_KEY_SECRET);
}

const OPENROUTER_KEY_SECRET = 'openRouterApiKey';

export async function getOpenRouterKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    return await context.secrets.get(OPENROUTER_KEY_SECRET);
}

export async function setOpenRouterKey(context: vscode.ExtensionContext, key: string): Promise<void> {
    await context.secrets.store(OPENROUTER_KEY_SECRET, key);
}
