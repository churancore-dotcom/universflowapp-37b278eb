// Validates that social-link inputs are actually real URLs on the right host —
// not just a name, a handle, or random text.
export type SocialPlatform = 'instagram' | 'youtube' | 'spotify' | 'apple_music';

const HOSTS: Record<SocialPlatform, RegExp> = {
  instagram: /^(www\.)?instagram\.com$/i,
  youtube: /^(www\.|m\.|music\.)?(youtube\.com|youtu\.be)$/i,
  spotify: /^(open\.|play\.)?spotify\.com$/i,
  apple_music: /^(music\.|geo\.music\.)?apple\.com$/i,
};

const LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  spotify: 'Spotify',
  apple_music: 'Apple Music',
};

export interface LinkCheck { ok: boolean; reason?: string; normalized?: string }

// Obvious junk handles people type to bypass the check.
const JUNK = /^(test|asdf|abcd|qwerty|xxxx|none|nil|null|undefined|fake|user|me|admin|jrj|aaa+|hhh+|jjj+)$/i;

export function validateSocialLink(platform: SocialPlatform, raw: string): LinkCheck {
  const value = (raw || '').trim();
  if (!value) return { ok: true };
  let url: URL;
  try {
    url = new URL(value.startsWith('http') ? value : `https://${value}`);
  } catch {
    return { ok: false, reason: `Paste a full ${LABEL[platform]} URL (https://…), not just a name.` };
  }
  if (!HOSTS[platform].test(url.hostname)) {
    return { ok: false, reason: `That doesn't look like a ${LABEL[platform]} link.` };
  }
  const path = url.pathname.replace(/^\/+|\/+$/g, '');
  if (path.length < 3) {
    return { ok: false, reason: `Link to your ${LABEL[platform]} profile, not the homepage.` };
  }
  const handle = path.split('/')[0].replace(/^@/, '');
  if (handle.length < 4) {
    return { ok: false, reason: `That handle is too short to be a real ${LABEL[platform]} profile.` };
  }
  if (JUNK.test(handle)) {
    return { ok: false, reason: `"${handle}" doesn't look like a real ${LABEL[platform]} profile.` };
  }
  if (platform === 'spotify' && !/^artist\/[A-Za-z0-9]{10,}/.test(path)) {
    return { ok: false, reason: 'Paste your Spotify artist link (open.spotify.com/artist/…).' };
  }
  if (platform === 'apple_music' && !/artist\//.test(path)) {
    return { ok: false, reason: 'Paste your Apple Music artist link (music.apple.com/…/artist/…).' };
  }
  return { ok: true, normalized: url.toString() };
}

export function atLeastNValidLinks(
  links: Partial<Record<SocialPlatform, string>>,
  min: number,
): { ok: boolean; reason?: string } {
  const entries = Object.entries(links) as Array<[SocialPlatform, string]>;
  const filled = entries.filter(([, v]) => v && v.trim().length > 0);
  if (filled.length < min) {
    return { ok: false, reason: `Add at least ${min} real artist profile link${min === 1 ? '' : 's'} so we can verify you.` };
  }
  let validCount = 0;
  for (const [p, v] of filled) {
    const r = validateSocialLink(p, v);
    if (!r.ok) return { ok: false, reason: r.reason };
    validCount++;
  }
  if (validCount < min) {
    return { ok: false, reason: `Add at least ${min} valid artist profile link${min === 1 ? '' : 's'}.` };
  }
  return { ok: true };
}

export function atLeastOneValidLink(links: Partial<Record<SocialPlatform, string>>) {
  return atLeastNValidLinks(links, 1);
}
