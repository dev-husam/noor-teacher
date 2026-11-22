// Popcorn machine artwork (from the standalone popcorn app), ids/classes prefixed with `pop-`.
export const MACHINE_SVG = `<defs>
<pattern id="pop-stripeV" width="40" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#E8344E"/><rect x="20" width="20" height="10" fill="#fff"/></pattern>
<linearGradient id="pop-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1A8"/><stop offset=".45" stop-color="#FFD93D"/><stop offset="1" stop-color="#E09B00"/></linearGradient>
<linearGradient id="pop-glassG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".3" stop-color="#cfefff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>
<radialGradient id="pop-glow"><stop offset="0" stop-color="#FFF3A0" stop-opacity=".95"/><stop offset=".7" stop-color="#FF9F43" stop-opacity=".35"/><stop offset="1" stop-color="#FF9F43" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="200" cy="550" rx="170" ry="9" fill="rgba(64,32,95,.25)"/>
<rect x="38" y="368" width="324" height="178" rx="22" fill="url(#pop-stripeV)" stroke="#40205F" stroke-width="5"/>
<rect x="30" y="360" width="340" height="20" rx="10" fill="#8B5CF6" stroke="#40205F" stroke-width="4"/>
<rect x="84" y="388" width="232" height="64" rx="32" fill="#FFF8E7" stroke="#40205F" stroke-width="4"/>
<g class="pop-eye"><ellipse cx="158" cy="418" rx="13" ry="15" fill="#fff" stroke="#40205F" stroke-width="3"/><g class="pop-pupil"><circle cx="160" cy="420" r="7" fill="#40205F"/><circle cx="163" cy="416" r="2.6" fill="#fff"/></g></g>
<g class="pop-eye"><ellipse cx="242" cy="418" rx="13" ry="15" fill="#fff" stroke="#40205F" stroke-width="3"/><g class="pop-pupil"><circle cx="240" cy="420" r="7" fill="#40205F"/><circle cx="243" cy="416" r="2.6" fill="#fff"/></g></g>
<circle cx="120" cy="436" r="8" fill="#FF69B4" opacity=".6"/><circle cx="280" cy="436" r="8" fill="#FF69B4" opacity=".6"/>
<path class="pop-smile" d="M182 432 Q200 450 218 432" fill="none" stroke="#40205F" stroke-width="5" stroke-linecap="round"/>
<g class="pop-open"><path d="M180 428 Q200 458 220 428 Z" fill="#E8344E" stroke="#40205F" stroke-width="4" stroke-linejoin="round"/><path d="M190 442 Q200 435 210 442 Q200 452 190 442Z" fill="#FF9BB0"/></g>
<rect x="58" y="112" width="284" height="250" rx="14" fill="#FFF3C4" opacity=".35"/>
<rect class="pop-glow" x="58" y="112" width="284" height="250" rx="14" fill="url(#pop-glow)"/>
<rect x="196" y="112" width="8" height="26" fill="url(#pop-gold)" stroke="#40205F" stroke-width="3"/>
<path d="M138 152 q-24 6 -8 30" fill="none" stroke="#E09B00" stroke-width="9" stroke-linecap="round"/>
<path d="M262 152 q24 6 8 30" fill="none" stroke="#E09B00" stroke-width="9" stroke-linecap="round"/>
<path d="M140 138 Q200 130 260 138 Q254 192 200 198 Q146 192 140 138Z" fill="url(#pop-gold)" stroke="#40205F" stroke-width="4" stroke-linejoin="round"/>
<ellipse cx="200" cy="138" rx="60" ry="8" fill="#E09B00" stroke="#40205F" stroke-width="3"/>
<ellipse cx="172" cy="166" rx="14" ry="7" fill="#fff" opacity=".55" transform="rotate(-25 172 166)"/>
<rect x="58" y="112" width="284" height="250" rx="14" fill="url(#pop-glassG)" stroke="#fff" stroke-opacity=".9" stroke-width="3"/>
<path d="M76 130 Q72 240 84 340" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55" fill="none"/>
<path d="M92 130 L92 160" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
<rect x="40" y="104" width="18" height="268" rx="7" fill="url(#pop-gold)" stroke="#40205F" stroke-width="4"/>
<rect x="342" y="104" width="18" height="268" rx="7" fill="url(#pop-gold)" stroke="#40205F" stroke-width="4"/>
<rect x="46" y="352" width="308" height="18" rx="9" fill="url(#pop-gold)" stroke="#40205F" stroke-width="4"/>
<path d="M30 112 L52 54 Q56 42 70 42 H330 Q344 42 348 54 L370 112 Z" fill="url(#pop-stripeV)" stroke="#40205F" stroke-width="5" stroke-linejoin="round"/>
<rect x="116" y="6" width="168" height="44" rx="16" fill="#8B5CF6" stroke="#40205F" stroke-width="4"/>
<text x="200" y="38" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" style="font-family:var(--display)">🍿 فشار 🍿</text>
<g>
<circle class="pop-bulb" cx="55" cy="112" r="7"/><circle class="pop-bulb" cx="84" cy="112" r="7"/><circle class="pop-bulb" cx="113" cy="112" r="7"/>
<circle class="pop-bulb" cx="142" cy="112" r="7"/><circle class="pop-bulb" cx="171" cy="112" r="7"/><circle class="pop-bulb" cx="200" cy="112" r="7"/>
<circle class="pop-bulb" cx="229" cy="112" r="7"/><circle class="pop-bulb" cx="258" cy="112" r="7"/><circle class="pop-bulb" cx="287" cy="112" r="7"/>
<circle class="pop-bulb" cx="316" cy="112" r="7"/><circle class="pop-bulb" cx="345" cy="112" r="7"/>
</g>
<rect x="62" y="544" width="40" height="12" rx="6" fill="#8B5CF6" stroke="#40205F" stroke-width="3"/>
<rect x="298" y="544" width="40" height="12" rx="6" fill="#8B5CF6" stroke="#40205F" stroke-width="3"/>`;
