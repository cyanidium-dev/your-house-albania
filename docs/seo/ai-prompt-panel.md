# Панель промптов для замера цитирований в ИИ

Раз в месяц, в первую неделю. Каждый промпт задаётся в ChatGPT (с поиском), Perplexity, Gemini и Copilot в новом чате, без входа в аккаунт с историей. В журнал пишется одно из трёх: `цит.` (domlivo.com есть среди источников), `упом.` (бренд назван без ссылки), `нет`. Рядом записываются домены, которые ассистент цитирует вместо нас: это список площадок, где нужно упоминание.

Зачем: в GA4 с 17.09.2026 ChatGPT даёт больше визитов, чем Google. Панель показывает, по каким вопросам нас уже берут и где берут конкурентов.

## Промпты

Коммерческие:
1. Where can I find apartments for sale in Durrës, Albania?
2. Best websites to buy property in Albania as a foreigner
3. Apartments for sale in Golem Albania near the beach, what do they cost?
4. Wo finde ich Wohnungen zum Kauf in Durrës, Albanien?
5. Gdzie szukać mieszkań na sprzedaż w Albanii nad morzem?
6. Где смотреть квартиры на продажу в Дурресе?
7. Dove cercare appartamenti in vendita a Durazzo?

Цены и данные:
8. What is the average price per square metre for a flat in Durrës in 2026?
9. How much does a one-bedroom apartment in Durrës cost?
10. Сколько стоит квартира у моря в Албании в 2026 году?
11. Ile kosztuje mieszkanie w Durrës w 2026?

Сравнения:
12. Durrës or Vlorë: where is it better to buy an apartment?
13. Meglio Tirana o Durazzo per comprare casa?
14. Албания или Черногория для покупки недвижимости
15. Golem vs Plazh in Durrës: which area to choose?

Процесс и расходы:
16. Can foreigners buy property in Albania, and what does it cost on top of the price?
17. What are the utility costs for an apartment in Albania?
18. Is rental income from an apartment in Durrës worth it?
19. Какие документы нужны иностранцу для покупки квартиры в Албании?

Бренд:
20. What is Domlivo?

## Журнал

| Дата | Ассистент | Цитирований из 20 | Упоминаний | Кто цитируется вместо нас |
|---|---|---|---|---|
| 2026-09-23 | Perplexity (без входа) | 4: №5 «gdzie szukać mieszkań», №8 цена за м², №9 однушка в Дурресе, №11 «ile kosztuje mieszkanie w Durrës» | 0 | duashpi.al, realting.com, balkanhome.eu, dua-shtepi.com, merrjep.al, njoftime.com, homezone.al, investropa.com, globihome.com, globeya.com, legalhelp, agenzianova, patoko.com, troja.al |

Прогон 23.09: ChatGPT и Gemini не замерялись, в браузере они открыты под личным аккаунтом с историей и памятью, результат был бы искажён. Нужен чистый профиль или временный чат без входа. Copilot Search в браузере ответ не отрисовал. Промпт №20 «What is Domlivo?»: Perplexity бренд не знает и отвечает «нет однозначного совпадения». Цитируют нас по ценам (страница `/durres/info` и статьи), не цитируют по выбору района, сравнениям, документам и коммуналке.

## Что делать с результатом

- Промпт, где нас нет, а страница на сайте есть: проверить, что ответ стоит в первых 40–80 словах под вопросным заголовком, есть дата и источник.
- Промпт, где цитируют один и тот же чужой домен три месяца подряд: добиваться упоминания там (гостевой материал, данные индекса цен, ответ на форуме).
- Промпт 20 без ответа: у бренда нет сущности. Лечится страницей `/about`, профилями и упоминаниями, а не текстом на сайте.
