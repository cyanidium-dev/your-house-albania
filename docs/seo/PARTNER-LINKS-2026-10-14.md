# Partner link requests (2026-10-14)

Decision 9 of the 13.10 audit. Drafts only: nothing has been sent. Sending is the owner's call.

## Why

Ahrefs, 13.10: DR 0. 698 referring domains, nearly all spam link shops; real editorial links: 0.
Commercial queries sit at positions 16–38. Four links from live partner domains would be the first real links the site has.
Each partner gains something too: a page that sells its listings in seven languages.

## Who and where the link points

Agent pages (`/agent/<slug>`) are `noindex` as of today, so a link to them would pass
little. Each partner gets a commercial page instead, one page per partner so the anchors differ:

| Partner | Listings on Domlivo | Link target | Anchor |
|---|---|---|---|
| Cactus Real Estate | 373 | https://www.domlivo.com/en/albania/durres | Apartments for sale in Durrës |
| Adrian | 278 | https://www.domlivo.com/en | Domlivo — property in Albania in 7 languages |
| Find All Properties | 115 | https://www.domlivo.com/en/property-for-sale-albania-by-the-sea | Albania property for sale by the sea |
| Grinchenko Real Estate (Viktor) | 40 | https://www.domlivo.com/ru/kupit-kvartiru-v-albanii | Купить квартиру в Албании |

Ask for:
- One plain link from a page Google already indexes (a footer, "Partners" or "Where to find our listings").
- The target and anchor from the table above.
- Not `nofollow`.
- Descriptive anchor text, not a bare URL.

Ready-made snippet:

```html
<a href="https://www.domlivo.com/en/albania/durres">Apartments for sale in Durrës</a>
```

## Message, English

> Hi {name},
>
> Your {N} listings are now on Domlivo in seven languages: English, German, Polish, Italian, Ukrainian, Russian and Albanian. Buyers from those countries find them through Google and ChatGPT. In the last 28 days the site had about 9,000 Google search impressions, and we pass every request about your listings to you.
>
> One small favour would help both of us. Could you add a link to Domlivo somewhere on your site, for example in the footer or on a "Partners" page? Here is the link: {link target}. Suggested text: "{anchor}". The more Google trusts the site, the higher your listings rank abroad.
>
> Thank you,
> {owner name}, Domlivo

## Message, Albanian

> Përshëndetje {name},
>
> {N} njoftimet tuaja janë tani në Domlivo në shtatë gjuhë: anglisht, gjermanisht, polonisht, italisht, ukrainisht, rusisht dhe shqip. Blerësit nga këto vende i gjejnë përmes Google dhe ChatGPT. Çdo kërkesë për njoftimet tuaja jua kalojmë juve.
>
> Një nder i vogël do të na ndihmonte të dyve. A mund të vendosni një lidhje drejt Domlivo diku në faqen tuaj, p.sh. në fund të faqes ose te «Partnerët»? Lidhja: {link target}. Teksti i propozuar: «{anchor}». Sa më shumë t'i besojë Google faqes, aq më lart dalin njoftimet tuaja jashtë vendit.
>
> Faleminderit,
> {owner name}, Domlivo

## Message, Russian (for Viktor)

> Виктор, привет!
>
> Ваши {N} объектов теперь на Domlivo на семи языках. Покупатели из Польши, Германии, Италии, Украины и других стран находят их через Google и ChatGPT, а заявки по ним мы передаём вам.
>
> Небольшая просьба, которая поможет обоим. Можно поставить на вашем сайте (в подвале или на странице «Партнёры») ссылку на Domlivo: https://www.domlivo.com/ru/kupit-kvartiru-v-albanii? Текст ссылки: «Купить квартиру в Албании». Чем больше Google доверяет сайту, тем выше ваши объекты в выдаче за рубежом.
>
> Спасибо!

## After a link goes up

- Check that the link is followed and that the page is in Google (`site:` search).
- Record the date here; Ahrefs shows the new referring domain within about two weeks.
