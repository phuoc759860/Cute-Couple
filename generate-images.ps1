$dir = "D:\LEARNING\Websites\Lovely Couple\images"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

# title, c1, c2, accent, theme, decor
$items = @(
  @{ name="photo-1"; c1="#f9c6d0"; c2="#ff8fa8"; a="#fff0e6"; theme="sun";   decor="sun" },
  @{ name="photo-2"; c1="#f3e3c9"; c2="#d9a066"; a="#fff8ef"; theme="cafe";  decor="cafe" },
  @{ name="photo-3"; c1="#e8b4c8"; c2="#a0496c"; a="#ffe9f0"; theme="dinner";decor="lights" },
  @{ name="photo-4"; c1="#cfd9ee"; c2="#8fa7d6"; a="#f0f4ff"; theme="lazy";  decor="clouds" },
  @{ name="photo-5"; c1="#b7d3c0"; c2="#5f8f7a"; a="#eaf5ee"; theme="mountain";decor="mountain" },
  @{ name="photo-6"; c1="#ffd9a0"; c2="#f09a5a"; a="#fff4e2"; theme="cake";  decor="confetti" },
  @{ name="photo-7"; c1="#a9b8cf"; c2="#6a7f9e"; a="#e8eef8"; theme="rain";  decor="rain" },
  @{ name="photo-8"; c1="#2b2140"; c2="#0f0c22"; a="#f4e9ff"; theme="stars"; decor="stars" },
  @{ name="photo-9"; c1="#1f2b4d"; c2="#3a1f4d"; a="#ffe9f0"; theme="city";  decor="city" }
)

$heart = '<path d="M12 21s-7.5-4.9-10-9.5C.5 8.5 2 4.5 6 3.5c2.4-.6 4.5.3 6 2 1.5-1.7 3.6-2.6 6-2 4 1 5.5 5 4 8C19.5 16.1 12 21 12 21z"/>'

foreach ($it in $items) {
  $c1 = $it.c1; $c2 = $it.c2; $a = $it.a; $theme = $it.theme
  $decor = ""
  switch ($theme) {
    "sun" {
      $decor = @"
<circle cx="620" cy="130" r="70" fill="rgba(255,240,230,0.7)"/>
<path d="M0 470 Q200 390 420 450 T800 430 L800 600 L0 600 Z" fill="rgba(255,240,230,0.55)"/>
<g fill="rgba(255,255,255,0.5)">
  <path d="M250 430 q-5-18 0-30 5 12 0 30z M280 440 q-5-22 0-36 5 14 0 36z M300 425 q-4-14 0-24 4 10 0 24z"/>
  <path d="M480 450 q-6-22 0-36 6 14 0 36z M520 440 q-5-18 0-30 5 12 0 30z M545 455 q-4-14 0-24 4 10 0 24z"/>
</g>
"@
    }
    "cafe" {
      $decor = @"
<rect x="120" y="300" width="200" height="250" rx="8" fill="rgba(255,255,255,0.5)"/>
<rect x="480" y="260" width="220" height="290" rx="8" fill="rgba(255,255,255,0.5)"/>
<rect x="140" y="330" width="160" height="16" rx="8" fill="rgba(217,160,102,0.6)"/>
<rect x="500" y="290" width="180" height="16" rx="8" fill="rgba(217,160,102,0.6)"/>
<circle cx="640" cy="180" r="46" fill="rgba(255,255,255,0.6)"/>
<path d="M600 180 a46 46 0 0 1 46 -46" stroke="rgba(120,80,40,0.5)" stroke-width="6" fill="none"/>
"@
    }
    "dinner" {
      $decor = @"
<g stroke="#ffd1de" stroke-width="3" opacity="0.8">
  <path d="M0 40 Q100 90 200 40 T400 40 T600 40 T800 40"/>
  <path d="M0 80 Q100 130 200 80 T400 80 T600 80 T800 80"/>
  <path d="M0 120 Q100 170 200 120 T400 120 T600 120 T800 120"/>
</g>
<g fill="rgba(255,255,255,0.35)">
  <ellipse cx="400" cy="470" rx="220" ry="40"/>
</g>
"@
    }
    "lazy" {
      $decor = @"
<g fill="rgba(255,255,255,0.55)">
  <ellipse cx="220" cy="160" rx="120" ry="46"/>
  <ellipse cx="300" cy="140" rx="110" ry="42"/>
  <ellipse cx="600" cy="120" rx="130" ry="48"/>
  <ellipse cx="680" cy="100" rx="100" ry="38"/>
</g>
"@
    }
    "mountain" {
      $decor = @"
<path d="M0 470 L220 200 L380 470 Z" fill="rgba(240,250,245,0.7)"/>
<path d="M280 470 L520 170 L740 470 Z" fill="rgba(220,245,232,0.85)"/>
<path d="M420 470 L640 260 L820 470 Z" fill="rgba(200,235,215,0.7)"/>
<circle cx="660" cy="120" r="46" fill="rgba(255,246,230,0.9)"/>
"@
    }
    "cake" {
      $decor = @"
<g fill="#fff0d9">
  <rect x="300" y="360" width="220" height="60" rx="10"/>
  <rect x="320" y="420" width="180" height="70" rx="10"/>
  <rect x="340" y="490" width="140" height="60" rx="10"/>
</g>
<g fill="#ffb27a">
  <rect x="300" y="340" width="220" height="22" rx="8"/>
</g>
<g fill="#fff" opacity="0.8">
  <circle cx="320" cy="120" r="6"/><circle cx="400" cy="80" r="8"/><circle cx="480" cy="140" r="5"/>
  <circle cx="240" cy="160" r="5"/><circle cx="560" cy="110" r="6"/><circle cx="680" cy="150" r="7"/>
  <circle cx="150" cy="120" r="4"/><circle cx="640" cy="80" r="4"/>
</g>
"@
    }
    "rain" {
      $decor = @"
<g stroke="rgba(255,255,255,0.5)" stroke-width="4" stroke-linecap="round">
  <line x1="120" y1="120" x2="110" y2="180"/>
  <line x1="260" y1="100" x2="250" y2="170"/>
  <line x1="430" y1="140" x2="420" y2="210"/>
  <line x1="560" y1="90" x2="550" y2="160"/>
  <line x1="680" y1="150" x2="670" y2="220"/>
</g>
<ellipse cx="620" cy="440" rx="150" ry="60" fill="rgba(30,40,60,0.35)"/>
"@
    }
    "stars" {
      $decor = @"
<g fill="#fff">
  <circle cx="120" cy="90" r="3"/><circle cx="220" cy="60" r="2"/><circle cx="320" cy="120" r="3"/>
  <circle cx="450" cy="70" r="2.5"/><circle cx="560" cy="130" r="3"/><circle cx="660" cy="60" r="2.5"/>
  <circle cx="740" cy="110" r="3"/><circle cx="180" cy="170" r="2"/><circle cx="600" cy="200" r="2.5"/>
  <circle cx="90" cy="220" r="2.5"/><circle cx="380" cy="200" r="2"/>
</g>
<g fill="#fff">
  <circle cx="640" cy="150" r="2.5" opacity="0.8"/><circle cx="520" cy="90" r="2" opacity="0.6"/>
</g>
<path d="M300 420 L470 420 L470 500 L300 500 Z" fill="rgba(244,233,255,0.5)"/>
<path d="M360 460 L410 460 L410 490 L360 490 Z" fill="rgba(244,233,255,0.8)"/>
"@
    }
    "city" {
      $decor = @"
<g fill="#0f1a33">
  <rect x="60" y="260" width="90" height="340"/>
  <rect x="180" y="200" width="80" height="400"/>
  <rect x="290" y="300" width="100" height="300"/>
  <rect x="420" y="180" width="90" height="420"/>
  <rect x="540" y="260" width="110" height="340"/>
  <rect x="680" y="220" width="80" height="380"/>
</g>
<g fill="#ffd1de">
  <rect x="80" y="290" width="14" height="14"/><rect x="120" y="340" width="14" height="14"/>
  <rect x="200" y="240" width="14" height="14"/><rect x="230" y="300" width="14" height="14"/>
  <rect x="320" y="340" width="14" height="14"/><rect x="360" y="420" width="14" height="14"/>
  <rect x="450" y="230" width="14" height="14"/><rect x="470" y="320" width="14" height="14"/>
  <rect x="570" y="300" width="14" height="14"/><rect x="610" y="380" width="14" height="14"/>
  <rect x="700" y="260" width="14" height="14"/><rect x="730" y="340" width="14" height="14"/>
</g>
"@
    }
  }

  $heartRow = ""
  if ($theme -in @("stars", "city")) {
    $heartRow = "<g fill=""rgba(255,209,222,0.9)"" opacity=""0.9""><g transform=""translate(330,430) scale(0.7)"">$heart</g><g transform=""translate(420,420) scale(1)"" fill=""#ff8fa8"">$heart</g></g>"
  } else {
    $heartRow = "<g fill=""rgba(255,255,255,0.75)""><g transform=""translate(340,400) scale(1.4)"">$heart</g><g transform=""translate(430,390) scale(1)"" fill=""rgba(255,209,222,0.95)"">$heart</g></g>"
  }

  $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="$c1"/>
      <stop offset="100%" stop-color="$c2"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  $decor
  $heartRow
  <text x="400" y="560" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="30" fill="rgba(255,255,255,0.9)">Replace with your photo</text>
</svg>
"@
  Set-Content -LiteralPath (Join-Path $dir "$($it.name).svg") -Value $svg -Encoding UTF8
}

# favicon
$fav = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e0527a"/><stop offset="100%" stop-color="#c93b66"/>
  </linearGradient></defs>
  <path fill="url(#g)" d="M12 21s-7.5-4.9-10-9.5C.5 8.5 2 4.5 6 3.5c2.4-.6 4.5.3 6 2 1.5-1.7 3.6-2.6 6-2 4 1 5.5 5 4 8C19.5 16.1 12 21 12 21z"/>
</svg>
"@
Set-Content -LiteralPath (Join-Path $dir "favicon.svg") -Value $fav -Encoding UTF8

Write-Output "Generated $($items.Count) placeholder images + favicon in $dir"
