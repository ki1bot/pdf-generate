import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blockedNetworks = new BlockList();

blockedNetworks.addSubnet("0.0.0.0", 8, "ipv4");
blockedNetworks.addSubnet("10.0.0.0", 8, "ipv4");
blockedNetworks.addSubnet("100.64.0.0", 10, "ipv4");
blockedNetworks.addSubnet("127.0.0.0", 8, "ipv4");
blockedNetworks.addSubnet("169.254.0.0", 16, "ipv4");
blockedNetworks.addSubnet("172.16.0.0", 12, "ipv4");
blockedNetworks.addSubnet("192.0.0.0", 24, "ipv4");
blockedNetworks.addSubnet("192.0.2.0", 24, "ipv4");
blockedNetworks.addSubnet("192.168.0.0", 16, "ipv4");
blockedNetworks.addSubnet("198.18.0.0", 15, "ipv4");
blockedNetworks.addSubnet("198.51.100.0", 24, "ipv4");
blockedNetworks.addSubnet("203.0.113.0", 24, "ipv4");
blockedNetworks.addSubnet("224.0.0.0", 4, "ipv4");
blockedNetworks.addSubnet("240.0.0.0", 4, "ipv4");
blockedNetworks.addSubnet("::", 128, "ipv6");
blockedNetworks.addSubnet("::1", 128, "ipv6");
blockedNetworks.addSubnet("::ffff:0:0", 96, "ipv6");
blockedNetworks.addSubnet("fc00::", 7, "ipv6");
blockedNetworks.addSubnet("fe80::", 10, "ipv6");
blockedNetworks.addSubnet("ff00::", 8, "ipv6");
blockedNetworks.addSubnet("2001:db8::", 32, "ipv6");

const blockedHostnames = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/\.$/, "");
}

function isBlockedHostname(hostname: string) {
  return (
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  );
}

function isBlockedAddress(address: string) {
  const family = isIP(address);

  if (family === 4) {
    return blockedNetworks.check(address, "ipv4");
  }

  if (family === 6) {
    return blockedNetworks.check(address, "ipv6");
  }

  return true;
}

async function assertPublicHostname(
  hostname: string,
  cache?: Map<string, Promise<void>>,
) {
  const normalizedHostname = normalizeHostname(hostname);

  if (isBlockedHostname(normalizedHostname)) {
    throw new UrlValidationError("Alamat lokal atau internal tidak diizinkan.");
  }

  const cachedCheck = cache?.get(normalizedHostname);

  if (cachedCheck) {
    await cachedCheck;
    return;
  }

  const check = (async () => {
    if (isIP(normalizedHostname)) {
      if (isBlockedAddress(normalizedHostname)) {
        throw new UrlValidationError(
          "Alamat IP privat atau khusus tidak diizinkan.",
        );
      }

      return;
    }

    let addresses;

    try {
      addresses = await lookup(normalizedHostname, {
        all: true,
        verbatim: true,
      });
    } catch {
      throw new UrlValidationError(
        "Domain tidak ditemukan atau tidak dapat diakses.",
      );
    }

    if (addresses.length === 0) {
      throw new UrlValidationError(
        "Domain tidak memiliki alamat IP yang valid.",
      );
    }

    if (addresses.some(({ address }) => isBlockedAddress(address))) {
      throw new UrlValidationError(
        "Domain mengarah ke jaringan privat atau khusus.",
      );
    }
  })();

  cache?.set(normalizedHostname, check);

  try {
    await check;
  } catch (error) {
    cache?.delete(normalizedHostname);
    throw error;
  }
}

function addDefaultProtocol(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export async function validateTargetUrl(rawUrl: string) {
  const value = rawUrl.trim();

  if (!value) {
    throw new UrlValidationError("URL website wajib diisi.");
  }

  if (value.length > 2048) {
    throw new UrlValidationError("URL website terlalu panjang.");
  }

  let url: URL;

  try {
    url = new URL(addDefaultProtocol(value));
  } catch {
    throw new UrlValidationError("Format URL website tidak valid.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new UrlValidationError("Hanya URL HTTP dan HTTPS yang diizinkan.");
  }

  if (url.username || url.password) {
    throw new UrlValidationError(
      "URL dengan username atau password tidak diizinkan.",
    );
  }

  await assertPublicHostname(url.hostname);

  return url;
}

export async function validateResourceUrl(
  rawUrl: string,
  cache: Map<string, Promise<void>>,
) {
  const url = new URL(rawUrl);

  if (["data:", "blob:", "about:"].includes(url.protocol)) {
    return;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new UrlValidationError("Protokol resource tidak diizinkan.");
  }

  await assertPublicHostname(url.hostname, cache);
}
