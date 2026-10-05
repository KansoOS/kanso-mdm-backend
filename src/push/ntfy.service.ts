import { Injectable } from '@nestjs/common';

@Injectable()
export class NtfyService {
  async wake(topic: string): Promise<void> {
    const baseUrl = process.env.NTFY_URL;

    if (!baseUrl) {
      return;
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sync: true }),
    });

    if (!response.ok) {
      throw new Error(`ntfy returned ${response.status}`);
    }
  }
}
