# Профили Domlivo: LinkedIn и Facebook

Тексты для полей, готовые к вставке. Везде одно имя, одно описание, одна ссылка: так поисковики и ИИ-ассистенты связывают профили с сайтом. После создания пришлите ссылки, они пойдут в `sameAs` разметки Organization и в Studio.

Картинки (в `docs/marketing/assets/`):
- `avatar-dark-400.png`, `avatar-light-400.png`: аватар 400×400 (LinkedIn просит 300×300+, Facebook 170×170+; квадрат 400 подходит обоим).
- `linkedin-cover-1128x191.png`: обложка страницы LinkedIn.
- `facebook-cover-1640x624.png`: обложка страницы Facebook (показывается как 820×312).

## Общие поля

| Поле | Значение |
|---|---|
| Имя | `Domlivo` |
| Сайт | `https://www.domlivo.com` |
| Отрасль / категория | LinkedIn: Real Estate. Facebook: Real Estate Agency (вторая: Real Estate Service) |
| Размер | 2–10 сотрудников |
| Тип | Privately held |
| Город | Durrës, Albania |
| Языки | English, Russian, Ukrainian, Albanian, Italian, Polish, German |
| Email | hello@domlivo.com |
| WhatsApp | https://wa.me/message/KPXIGD5DJISGO1 |
| Telegram | https://t.me/real_estate_al |
| Год основания | укажите сами (поле необязательное, пустое лучше неверного) |

## LinkedIn

**Tagline** (до 120 знаков, 114):

> Real estate in Albania: verified listings, price data by district and an assistant that answers from our research.

**About** (до 2 000 знаков, ~1 250):

> Domlivo is a real-estate platform for people buying property in Albania, first of all in Durrës and along the coast.
>
> What you get on the site:
> • Listings from partner agencies, each with the district, distance to the sea and the asking-price history.
> • Price pages for Durrës, Tirana, Sarandë and Vlorë: euros per square metre by district, updated monthly from our own index of asking prices.
> • Buying guides in seven languages: how a foreigner buys in Albania, what the deal costs on top of the price, how districts compare.
> • An assistant that answers questions from our research and documents: utility bills, taxes, rental yield, paperwork.
>
> Behind Domlivo are three co-founders: Viktor Grinchenko, who lives in Durrës, runs Grinchenko Real Estate and has sold more than 100 apartments here; Fedir Alpatov, who builds the platform and the market research; and Diana Merkotun, who designs it.
>
> Our idea is a decentralised, analytical marketplace: no single agency owns the catalogue, the numbers are published with their sources, and the buyer gets a straight answer before a viewing.
>
> Buying in Albania or listing a property? Write to us: hello@domlivo.com, WhatsApp or Telegram, links on the site.

**Specialties** (через запятую):

> Real estate in Albania, Durrës apartments, sea view apartments, property price index, market analytics, buying guides for foreigners, investment property, new builds, Albanian property law basics, relocation to Albania

**Первый пост** (закрепить):

> Domlivo is now on LinkedIn.
>
> We publish what buyers in Albania usually have to guess: asking prices per square metre by district in Durrës, Tirana, Sarandë and Vlorë, updated every month, and guides on how a foreigner actually buys here and what it costs on top of the price.
>
> September index for Durrës, with the method and the sources: https://www.domlivo.com/en/blog/durres-asking-price-index-2026-09
>
> Questions about a district, a building or a document: hello@domlivo.com.

## Facebook

**Короткое описание / Bio** (до 101 знака, 100):

> Property in Albania: listings in Durrës and the coast, prices by district, help from search to keys.

**О компании / Additional information** (без жёсткого лимита):

> Domlivo helps you buy property in Albania: apartments, houses and villas in Durrës, on the coast and in Tirana.
>
> On the site you will find listings from partner agencies, price pages by district that we update every month, buying guides in seven languages and an assistant that answers questions from our research: utility costs, taxes, rental yield, paperwork for foreigners.
>
> The team lives and works in Albania. Viktor Grinchenko has sold more than 100 apartments in Durrës and helps with documents and renting the property out afterwards.
>
> Write to us on WhatsApp or Telegram, or leave a request on the site.

**Русская версия для поста или описания:**

> Domlivo помогает купить недвижимость в Албании: квартиры, дома и виллы в Дурресе, на побережье и в Тиране.
>
> На сайте: объекты партнёрских агентств, страницы цен по районам с ежемесячным обновлением, гайды по покупке на семи языках и ассистент, который отвечает на вопросы по нашим исследованиям: коммуналка, налоги, доходность аренды, документы для иностранца.
>
> Команда живёт и работает в Албании. Виктор Гринченко продал в Дурресе больше 100 квартир и помогает с документами и сдачей в аренду после покупки.
>
> Пишите в WhatsApp или Telegram или оставьте заявку на сайте.

**Кнопка действия:** «Send WhatsApp message» или «Contact us» → https://www.domlivo.com/en/contacts.

**Первый пост:** тот же текст, что для LinkedIn, плюс фото с обложки.

## После создания

1. Пришлите ссылки на обе страницы.
2. Я добавлю их в `siteSettings.socialLinks` (Studio) и в `sameAs` разметки; проверю, что на `/about` и главной они видны поисковику.
3. В LinkedIn у всех троих основателей в личном профиле указать Domlivo как место работы, у Виктора добавить строку про 100+ сделок в Дурресе и ссылку на канал.
4. Раз в месяц: пост с индексом цен и одна статья. Материал уже есть в блоге.

## Статус 28.09.2026

- LinkedIn: https://www.linkedin.com/company/domlivo (id 146659164). Заполнено: имя, адрес, сайт, отрасль, размер, тип, логотип, слоган, About, первый пост. Не заполнено: баннер (форма страницы использует один file-input на логотип и баннер, загрузка из расширения попадает в логотип; загрузить вручную: Edit page → Banner → Add cover image → `docs/marketing/assets/linkedin-cover-1128x191.png`), специализации и локация Durrës (клавиатурный ввод в Chrome был заблокирован системным диалогом).
- Facebook: https://www.facebook.com/profile.php?id=61594817704149. Заполнено: имя, категория Real Estate Service, bio, сайт, email, город Durrës, часы «Always open», аватар, обложка, первый пост. Не сделано: username страницы (Settings → Username → `domlivo`), кнопка действия, длинное описание (в новом интерфейсе Facebook страница показывает только bio).
- Обе ссылки добавлены в `siteSettings.socialLinks` (admin `addSocialProfiles20260928.ts`, rev `IVLcVaE7g6HuAB08OTHUyt`) и попадают в `sameAs` разметки Organization после ревалидации (до часа).
