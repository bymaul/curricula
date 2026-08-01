interface ErrorPayload {
    error?: unknown;
}

export async function parseResponseJSON<T>(response: Response): Promise<T> {
    const text = await response.text();

    let data: unknown = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
            data && typeof data === 'object' && 'error' in data && typeof (data as ErrorPayload).error === 'string'
                ? (data as ErrorPayload).error as string
                : `Request failed (${response.status})`;
        throw new Error(message);
    }

    return data as T;
}
