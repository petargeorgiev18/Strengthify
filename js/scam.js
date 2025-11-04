const urlInput = document.getElementById('urlInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const resultSummary = document.getElementById('resultSummary');
const flagsEl = document.getElementById('flags');
const adviceEl = document.getElementById('advice');
const themeSelector = document.getElementById('themeSelector');

function applyTheme(theme) {
    document.body.classList.remove('theme-dark');
    if (theme === 'dark') document.body.classList.add('theme-dark');
}

const savedTheme = localStorage.getItem('theme') || 'light';
themeSelector.value = savedTheme;
applyTheme(savedTheme);

themeSelector.addEventListener('change', () => {
    const val = themeSelector.value;
    applyTheme(val);
    localStorage.setItem('theme', val);
});

function showBox(el, html) {
    el.style.display = 'block';
    el.innerHTML = html;
}

function hideBoxes() {
    resultSummary.style.display = 'none';
    flagsEl.style.display = 'none';
    adviceEl.style.display = 'none';
}

function renderHeuristic(out) {
    if (out.error) {
        showBox(resultSummary, `<strong>Error:</strong> ${out.error}`);
        flagsEl.style.display = 'none';
        adviceEl.style.display = 'none';
        return;
    }

    const score = out.score ?? 100;
    const riskLabel = score < 40 ? 'High risk' : score < 70 ? 'Moderate risk' : 'Low risk';

    showBox(resultSummary, `<strong>Risk score:</strong> <span style="font-weight:800">${score}%</span><br><small>${riskLabel}</small>`);

    if (out.flags && out.flags.length) {
        showBox(flagsEl, '<strong>Detected signals</strong><ul>' + out.flags.map(f => `<li><strong>${f.text}</strong> — ${f.info}</li>`).join('') + '</ul>');
    } else {
        flagsEl.style.display = 'none';
    }

    if (out.recommendations && out.recommendations.length) {
        showBox(adviceEl, '<strong>Recommendations</strong><ul>' + out.recommendations.map(r => `<li>${r}</li>`).join('') + '</ul>');
    } else {
        adviceEl.style.display = 'none';
    }

    if (score < 40) {
        resultSummary.style.borderLeft = '4px solid #ef4444';
        resultSummary.style.background = 'rgba(239,68,68,0.04)';
    } else if (score < 70) {
        resultSummary.style.borderLeft = '4px solid #f59e0b';
        resultSummary.style.background = 'rgba(245,158,11,0.04)';
    } else {
        resultSummary.style.borderLeft = '4px solid #16a34a';
        resultSummary.style.background = 'rgba(16,163,74,0.04)';
    }
}

async function analyzeFlow(raw) {
    hideBoxes();
    if (!raw) {
        showBox(resultSummary, 'Paste a URL to analyze.');
        return;
    }

    try {
        const resp = await fetch(`/api/check?url=${encodeURIComponent(raw)}`);
        const json = await resp.json();

        if (!json.online) {
            showBox(resultSummary, `<strong>Site cannot be reached or does not exist.</strong>`);
            flagsEl.style.display = 'none';
            adviceEl.style.display = 'none';
            return;
        }

        if (json.error) {
            renderHeuristic({ error: json.error });
            return;
        }

        const heuristic = analyzeUrl(raw);
        const combinedFlags = heuristic.flags.slice();

        if (!json.safe) {
            combinedFlags.unshift({
                text: 'Known malicious (Google Safe Browsing)',
                info: 'Matched Google Safe Browsing threat list',
                weight: 50
            });
        }

        const combined = {
            score: scoreFlags(combinedFlags),
            flags: combinedFlags,
            recommendations: generateRecommendations(combinedFlags, heuristic.url || { origin: raw })
        };

        renderHeuristic(combined);
    } catch (err) {
        renderHeuristic({ error: err.message });
    }
}

analyzeBtn.addEventListener('click', () => analyzeFlow(urlInput.value.trim()));
clearBtn.addEventListener('click', () => { urlInput.value = ''; hideBoxes(); });
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') analyzeBtn.click(); });

function normalizeUrl(s) {
    try {
        if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
        return new URL(s);
    } catch { return null; }
}

function isIPAddress(host) { return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || /^0x[0-9a-f]+$/i.test(host); }
function countSubdomains(host) { const parts = host.split('.'); if (parts.length <= 2) return 0; return parts.length - 2; }
function containsPunycode(host) { return host.startsWith('xn--') || /\bxn--/i.test(host); }
function hasAtSymbol(url) { return url.href.includes('@'); }
function hasCredentials(url) { return Boolean(url.username || url.password); }
function suspiciousTLD(host) { const suspicious = ['tk', 'cf', 'ml', 'ga', 'gq']; const t = host.split('.').pop().toLowerCase(); return suspicious.includes(t); }
function longUrl(url) { return url.href.length > 80; }
function manyQueryParams(url) { return url.searchParams ? [...url.searchParams.keys()].length > 3 : false; }
function suspiciousKeywords(hostname, path) {
    const k = ['secure', 'account', 'login', 'verify', 'update', 'bank', 'confirm', 'password', 'paypal', 'appleid', 'signin', 'support', 'billing', 'confirm'];
    const text = (hostname + ' ' + path).toLowerCase();
    return k.filter(word => text.includes(word));
}
function nonAsciiChars(s) { return /[^\x00-\x7F]/.test(s); }
function similarTo(domain, known) {
    const d = domain.replace(/[^a-z0-9]/g, '').toLowerCase();
    for (const name of known) {
        const n = name.replace(/[^a-z0-9]/g, '').toLowerCase();
        if (n && d.includes(n) && d !== n) return true;
    }
    return false;
}
function scoreFlags(flags) {
    let score = 100;
    for (const f of flags) score -= f.weight || 5;
    score = Math.max(0, Math.min(100, Math.round(score)));
    return score;
}
function generateRecommendations(flags, url) {
    const rec = [];
    if (!flags.length) {
        rec.push('No obvious heuristic issues found. Use official links or bookmarks for sensitive sites.');
        rec.push('If this is for a login, ensure the site has HTTPS and a valid certificate.');
        return rec;
    }
    if (flags.some(f => f.key === 'no_https')) rec.push('Avoid entering credentials on non-HTTPS pages.');
    if (flags.some(f => f.key === 'ip_host')) rec.push('Do not trust IP-hosted logins; prefer official domains.');
    if (flags.some(f => f.key === 'has_creds' || f.key === 'has_at')) rec.push('Remove credentials from the URL and navigate to the root domain manually.');
    if (flags.some(f => f.key === 'punycode')) rec.push('Watch for unicode characters—inspect certificate in a safe environment.');
    if (flags.some(f => f.key === 'susp_keywords')) rec.push('If the page asks for account or password info unexpectedly, do not provide it.');
    if (flags.some(f => f.key === 'looks_like_brand')) rec.push('Compare the domain carefully to official domain (typosquatting possible).');
    rec.push('If in doubt, use an official app or search engine results rather than clicking links.');
    try { rec.push(`Preview: ${new URL(url).origin}`); } catch (_) { }
    return rec;
}

function analyzeUrl(raw) {
    const url = normalizeUrl(raw);
    if (!url) return { error: 'Invalid URL', flags: [], recommendations: [] };

    const host = url.hostname.toLowerCase();
    const path = (url.pathname + (url.search || '')).toLowerCase();
    const flags = [];

    const knownScamDomains = [
        'luvasti.com', 'luvasti.net', 'luvasti.org',
        'luvasti.online', 'luvasti.xyz', 'luvasti.club',
        'reward-luvasti.com', 'luvasti-rewards.com'
    ];

    const scamKeywords = [
        'luvasti', 'reward', 'prize', 'free', 'gift', 'bonus', 'claim',
        'win', 'winner', 'congrat', 'selected', 'lucky', 'voucher',
        'cash', 'money', 'offer', 'exclusive', 'limited', 'urgent'
    ];

    const officialDomains = [
        'paypal.com', 'google.com', 'facebook.com', 'apple.com', 'microsoft.com',
        'amazon.com', 'bank.com', 'chase.com', 'ing.com', 'hsbc.com'
    ];

    if (knownScamDomains.includes(host)) {
        flags.push({ key: 'known_scam', text: 'Known scam website', weight: 100, info: 'This domain has been reported as a scam site that tricks users with fake rewards.' });
    }

    const scamDomainPatterns = ['luvasti', 'reward', 'prize', 'freegift'];
    const domainMatches = scamDomainPatterns.filter(pattern => host.includes(pattern) && !knownScamDomains.includes(host));
    if (domainMatches.length > 0) flags.push({ key: 'suspicious_domain_pattern', text: `Suspicious domain pattern: ${domainMatches.join(', ')}`, weight: 30, info: 'Domain contains patterns commonly used in scam sites.' });

    const fullUrl = url.href.toLowerCase();
    const foundScamKeywords = scamKeywords.filter(keyword => fullUrl.includes(keyword.toLowerCase()));
    if (foundScamKeywords.length >= 2) flags.push({ key: 'scam_keywords', text: `Multiple scam-related keywords: ${foundScamKeywords.join(', ')}`, weight: foundScamKeywords.length * 8, info: 'Contains multiple keywords commonly used in scam and phishing sites.' });

    const suspiciousNewTLDs = ['xyz', 'top', 'club', 'online', 'site', 'website', 'fun', 'guru'];
    const tld = host.split('.').pop();
    if (suspiciousNewTLDs.includes(tld)) flags.push({ key: 'suspicious_tld', text: `Suspicious TLD: .${tld}`, weight: 12, info: 'This TLD is commonly used for scam and low-quality sites.' });

    const newDomainPatterns = [/^[a-z0-9]{8,16}\.(com|net|org)$/, /^(free|reward|prize|bonus)[a-z0-9]*\.[a-z]+$/];
    if (newDomainPatterns.some(pattern => pattern.test(host)) && !officialDomains.includes(host)) flags.push({ key: 'suspicious_domain_format', text: 'Suspicious domain name format', weight: 15, info: 'Domain name matches patterns commonly used by newly created scam sites.' });

    if (!/^https:/.test(url.protocol)) flags.push({ key: 'no_https', text: 'Not HTTPS', weight: 20, info: 'Connection is not encrypted (no HTTPS).' });
    if (isIPAddress(host)) flags.push({ key: 'ip_host', text: 'Host is IP address', weight: 25, info: 'Using raw IP instead of domain is suspicious.' });
    if (hasAtSymbol(url)) flags.push({ key: 'has_at', text: 'Contains "@" in URL', weight: 12, info: '"@" may hide the actual host.' });
    if (hasCredentials(url)) flags.push({ key: 'has_creds', text: 'Credentials in URL', weight: 30, info: 'URL contains user:pass@ — avoid.' });

    const subd = countSubdomains(host);
    if (subd >= 3) flags.push({ key: 'many_subdomains', text: `Many subdomains (${subd})`, weight: 8, info: 'Excessive subdomains can be used to mimic a legit site.' });

    if (containsPunycode(host) || nonAsciiChars(host)) flags.push({ key: 'punycode', text: 'International/punycode characters', weight: 15, info: 'Homograph attacks using unicode are possible.' });
    if (suspiciousTLD(host)) flags.push({ key: 'susp_tld', text: 'Suspicious TLD', weight: 10, info: 'Some free country-code TLDs are commonly abused.' });
    if (longUrl(url)) flags.push({ key: 'long_url', text: 'Long URL', weight: 6, info: 'Very long URLs often hide malicious parameters.' });
    if (manyQueryParams(url)) flags.push({ key: 'many_params', text: 'Many query parameters', weight: 6, info: 'Many parameters can indicate tracking or obfuscation.' });

    const keywords = suspiciousKeywords(host, path);
    if (keywords.length) flags.push({ key: 'susp_keywords', text: `Suspicious keywords: ${keywords.join(', ')}`, weight: 12, info: 'Contains keywords often used by phishing pages.' });

    const wellKnown = ['paypal', 'google', 'facebook', 'apple', 'microsoft', 'amazon', 'bank', 'chase', 'ing', 'hsbc'];
    if (wellKnown.some(name => similarTo(host, [name])) && !officialDomains.includes(host)) flags.push({ key: 'looks_like_brand', text: 'Looks like a known brand', weight: 18, info: 'Domain contains or mimics a known brand—possible impersonation.' });

    return { url: url.href, host, score: scoreFlags(flags), flags, recommendations: generateRecommendations(flags, url.href) };
}